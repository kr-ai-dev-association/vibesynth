import { test, expect } from './electron-fixture'

/**
 * Live Edit (popup) → Android emulator 동적 적용 검증.
 *
 * 실제 Gradle/adb는 안 돌리고:
 *   - main process의 'android:run' IPC 핸들러를 카운트하는 mock으로 교체
 *   - renderer의 fetch를 가로채 Gemini 응답을 위조
 *
 * 검증 사슬:
 *   A. UI Run 드롭다운 → "Android 에뮬레이터에서 실행" 클릭
 *   B. android:run IPC → mock 1회 호출 + success 반환
 *   C. setAndroidLiveMode(true) → useEffect가 platform='android' 푸시 →
 *      Live Edit popup 자동 오픈
 *   D. Live Edit popup의 Apply 버튼 클릭 → preload sendRequest →
 *      live-edit-request IPC → mainWindow webContents.send → 렌더러
 *      onLiveEditRequest 콜백 → androidLiveMode 분기 → editDesignsBatch
 *      (mocked fetch) → onProjectUpdate
 *   E. project.screens 변경 → useEffect debounce 2s → triggerAndroidBuild(false)
 *   F. android:run mock 2회째 호출
 */
test('Run Android → Live Edit prompt → android.run 재호출 (dynamic apply)', async ({ page, electronApp }) => {
  test.setTimeout(180_000)

  // ── main process: android:run IPC 카운터 mock 설치 ──
  await electronApp.evaluate(({ ipcMain }) => {
    try { ipcMain.removeHandler('android:run') } catch {}
    ;(global as any).__androidRunCalls = []
    ipcMain.handle('android:run', async (_e: any, ...args: any[]) => {
      ;(global as any).__androidRunCalls.push({ ts: Date.now(), args })
      return { success: true }
    })
  })

  // ── renderer: Gemini API fetch mock (editDesignsBatch가 LLM 안 거치게) ──
  await page.addInitScript(() => {
    const w = window as any
    w.__fetchCalls = []
    const realFetch = window.fetch.bind(window)
    window.fetch = async function (input: any, init?: any): Promise<Response> {
      const url = typeof input === 'string' ? input : input?.url
      w.__fetchCalls.push({ url, ts: Date.now() })
      if (url && /generativelanguage\.googleapis\.com/.test(url)) {
        // editDesignsBatch parse 포맷 그대로
        const text =
          '===== SCREEN: Home =====\n' +
          '<!DOCTYPE html><html><body><nav class="bottom-nav" style="background:navy">Home | Insights</nav><main><h1>Home (edited)</h1></main></body></html>\n\n' +
          '===== SCREEN: Insights =====\n' +
          '<!DOCTYPE html><html><body><nav class="bottom-nav" style="background:navy">Home | Insights</nav><main><h1>Insights (edited)</h1></main></body></html>'
        return new Response(
          JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }
      return realFetch(input, init)
    }
  })

  await page.waitForSelector('text=/Welcome to VibeSynth|VibeSynth/i', { timeout: 20_000 })

  // ── 시드 프로젝트 (2 screens, app device) ──
  const projectId = 'test-android-live-' + Date.now()
  const initialHtmlA = '<!DOCTYPE html><html><body><nav class="bottom-nav">Home | Insights</nav><main><h1>Home</h1></main></body></html>'
  const initialHtmlB = '<!DOCTYPE html><html><body><nav class="bottom-nav">Home | Insights</nav><main><h1>Insights</h1></main></body></html>'
  await page.evaluate(async ({ id, htmlA, htmlB }) => {
    const api = (window as any).electronAPI
    await api?.db?.saveProject?.({
      id,
      userId: 'default',
      name: 'Android Live E2E',
      prompt: 'lifeflow android',
      deviceType: 'app',
      screens: [
        { id: 's1', name: 'Home', html: htmlA },
        { id: 's2', name: 'Insights', html: htmlB },
      ],
      updatedAt: new Date().toLocaleDateString(),
    })
  }, { id: projectId, htmlA: initialHtmlA, htmlB: initialHtmlB })

  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1500)
  await page.locator('text="Android Live E2E"').first().click()
  await page.waitForSelector('[data-editor-canvas]', { timeout: 10_000 })
  await page.screenshot({ path: 'test-results/android-live-00-editor.png' })

  // 환경 검증을 위해 가짜 Android config를 db.settings에 박아 둔다 — 안 그러면
  // android:run 핸들러가 "Android 환경이 설정되지 않았습니다" 로 일찍 반환
  // → 우리는 이미 핸들러를 교체했으니 무관하지만 안전장치.

  // ── A. Run 드롭다운 → Android 에뮬레이터에서 실행 ──
  await page.getByTestId('run-dropdown-toggle').click()
  await page.getByTestId('run-android').click()

  // ── B. android:run mock 1회 ──
  await expect.poll(
    async () => electronApp.evaluate(() => ((global as any).__androidRunCalls || []).length),
    { timeout: 15_000 },
  ).toBeGreaterThanOrEqual(1)
  await page.screenshot({ path: 'test-results/android-live-01-after-run.png' })

  // ── C. androidLiveMode 진입 → Live Edit popup 자동 오픈 대기 ──
  let liveEditWindow: Awaited<ReturnType<typeof electronApp.firstWindow>> | null = null
  await expect.poll(async () => {
    const wins = electronApp.windows()
    const found = wins.find(w => /live-edit|Live Edit/i.test(w.url()) || w.url().includes('live-edit.html'))
    if (found) liveEditWindow = found
    return !!found
  }, { timeout: 15_000 }).toBeTruthy()
  expect(liveEditWindow).not.toBeNull()
  await liveEditWindow!.waitForLoadState('domcontentloaded')
  await page.screenshot({ path: 'test-results/android-live-02-live-edit-open.png' })

  // 헤더에 Android 플랫폼 배지 보이는지 확인
  const platformBadge = liveEditWindow!.locator('#le-platform')
  await expect(platformBadge).toContainText(/Android|🤖/, { timeout: 10_000 })

  // ── D. popup에 prompt 입력 + Apply ──
  await liveEditWindow!.locator('#le-input').fill('하단 nav 색상을 navy로 바꿔')
  await liveEditWindow!.locator('#le-submit').click()

  // ── E~F. fetch mock이 적어도 1번 호출되고 (= editDesignsBatch가 Gemini fetch
  // 시도) + 2초 debounce 후 android:run 2번째 호출 ──
  await expect.poll(
    async () => page.evaluate(() => ((window as any).__fetchCalls || []).filter((c: any) => /generativelanguage/.test(c.url)).length),
    { timeout: 15_000 },
  ).toBeGreaterThanOrEqual(1)

  // useEffect debounce는 2000ms — 여유 있게 6초
  await expect.poll(
    async () => electronApp.evaluate(() => ((global as any).__androidRunCalls || []).length),
    { timeout: 15_000 },
  ).toBeGreaterThanOrEqual(2)
  await page.screenshot({ path: 'test-results/android-live-03-after-edit-rebuild.png' })

  const finalCount = await electronApp.evaluate(() => ((global as any).__androidRunCalls || []).length)
  console.log('[E2E] android:run total calls:', finalCount)
  expect(finalCount).toBeGreaterThanOrEqual(2)

  // ── Cleanup ──
  await page.evaluate(async ({ id }) => {
    const api = (window as any).electronAPI
    try { await api?.project?.clean?.(id) } catch {}
    try { await api?.db?.deleteProject?.(id) } catch {}
  }, { id: projectId })
})
