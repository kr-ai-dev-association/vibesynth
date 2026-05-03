import { test, expect } from './electron-fixture'

/**
 * 캔버스 우클릭 → "새 빈 화면" 컨텍스트 메뉴 → 화면 추가까지 e2e.
 *
 * 빈 프로젝트로 시작하므로 Gemini 호출은 fallback boilerplate로 즉시
 * 끝나 비용이 들지 않는다 (handleCreateEmptyScreen에서 reference screen
 * 부재 시 small inline HTML로 대체).
 */
test('canvas 우클릭 → 새 빈 화면 메뉴 → 화면 추가', async ({ page }) => {
  await page.waitForSelector('text=/Welcome to VibeSynth|VibeSynth/i', { timeout: 20_000 })

  // 빈 프로젝트 직접 시드 (multi-screen LLM 빌드 회피)
  const projectId = 'test-empty-' + Date.now()
  await page.evaluate(async (id) => {
    const api = (window as any).electronAPI
    await api?.db?.saveProject?.({
      id,
      userId: 'default',
      name: 'Canvas RightClick Test',
      prompt: 'empty test',
      deviceType: 'app',
      screens: [],
      updatedAt: new Date().toLocaleDateString(),
    })
  }, projectId)

  // 대시보드 새로고침 후 프로젝트 카드 클릭으로 에디터 진입
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1200)
  await page.locator('text="Canvas RightClick Test"').first().click()

  // 에디터 캔버스 대기
  await page.waitForSelector('[data-editor-canvas]', { timeout: 10_000 })
  await page.screenshot({ path: 'test-results/new-empty-01-editor-loaded.png' })

  // 캔버스 빈 영역에 우클릭 (스크린 카드 없으므로 어디든 빈 영역)
  const canvas = page.locator('[data-editor-canvas]')
  const box = await canvas.boundingBox()
  expect(box).not.toBeNull()
  await canvas.click({ button: 'right', position: { x: Math.floor(box!.width / 2), y: Math.floor(box!.height / 2) } })

  // CanvasContextMenu의 "새 빈 화면" / "New empty screen" 항목 확인
  const menuItem = page.locator('text=/새 빈 화면|New empty screen/').first()
  await expect(menuItem).toBeVisible({ timeout: 3000 })
  await page.screenshot({ path: 'test-results/new-empty-02-context-menu.png' })

  // 클릭 → 신규 스크린 추가
  await menuItem.click()

  // "Untitled 1" 라벨 + 스크린 카드 1개 등장 대기 (LLM 호출 없는 fallback이라 즉시)
  await page.waitForSelector('text=/Untitled 1/', { timeout: 15_000 })
  await page.waitForFunction(() => document.querySelectorAll('[data-screen-card]').length === 1, { timeout: 15_000 })
  await page.screenshot({ path: 'test-results/new-empty-03-screen-added.png' })

  // 캔버스에 스크린 카드 1개가 표시되면 OK — DB 저장은 비동기라 확인 생략

  // Cleanup
  await page.evaluate(async (id) => {
    const api = (window as any).electronAPI
    try { await api?.project?.clean?.(id) } catch {}
    try { await api?.db?.deleteProject?.(id) } catch {}
  }, projectId)
})

/**
 * 햄버거 메뉴 → Generate → New empty screen 경로도 동일하게 동작.
 */
test('상단 햄버거 메뉴 → 생성 → 새 빈 화면', async ({ page }) => {
  await page.waitForSelector('text=/Welcome to VibeSynth|VibeSynth/i', { timeout: 20_000 })

  const projectId = 'test-hamburger-' + Date.now()
  await page.evaluate(async (id) => {
    const api = (window as any).electronAPI
    await api?.db?.saveProject?.({
      id,
      userId: 'default',
      name: 'Hamburger Generate Test',
      prompt: 'empty test',
      deviceType: 'web',
      screens: [],
      updatedAt: new Date().toLocaleDateString(),
    })
  }, projectId)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1200)
  await page.locator('text="Hamburger Generate Test"').first().click()
  await page.waitForSelector('[data-editor-canvas]', { timeout: 10_000 })

  // 햄버거 메뉴 열기
  await page.getByTestId('hamburger-menu').click()
  await page.screenshot({ path: 'test-results/new-empty-hamburger-01-open.png' })

  // 생성 그룹 헤더 확인 + "새 빈 화면" 클릭
  const newScreenItem = page.locator('text=/새 빈 화면|New empty screen/').first()
  await expect(newScreenItem).toBeVisible({ timeout: 3000 })
  await newScreenItem.click()

  // 신규 스크린 등장 확인
  await page.waitForSelector('text=/Untitled 1/', { timeout: 15_000 })
  await page.screenshot({ path: 'test-results/new-empty-hamburger-02-added.png' })

  // Cleanup
  await page.evaluate(async (id) => {
    const api = (window as any).electronAPI
    try { await api?.project?.clean?.(id) } catch {}
    try { await api?.db?.deleteProject?.(id) } catch {}
  }, projectId)
})
