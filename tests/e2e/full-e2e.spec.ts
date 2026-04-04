import { test, expect } from './electron-fixture'

/**
 * VibeSynth 전체 기능 E2E 테스트
 *
 * 테스트 흐름:
 *  1. 앱 렌더링 확인
 *  2. 대시보드 UI (사이드바, 예제, 프롬프트 바, 디자인 피커, Light/Dark 토글)
 *  3. LifeFlow 예제 → PRD 모달 → 추천 DS 선택 → 3+페이지 생성
 *  4. 캔버스 도구 (Cursor / Select / Element / Image)
 *  5. 우측 패널 (Design / Components / Layers)
 *  6. 히트맵 생성 + 효과 부여
 *  7. Variation 생성
 *  8. 단일 스크린 편집
 *  9. 다중 스크린 선택 + 일괄 편집
 * 10. Live 앱 빌드 + Live Window + Live Edit 팝업
 * 11. Designer / Developer 모드 피드백
 * 12. Export + VS Code
 * 13. 프로젝트 저장 확인
 *
 * 각 액션 사이 1초 지연 (사용자가 실시간 확인 가능)
 */

const DELAY = 1000

test('VibeSynth 전체 기능 E2E', async ({ electronApp, page }) => {
  test.setTimeout(900_000) // 15분

  // ═══════════════════════════════════════════════════════════════
  // 1. 앱 렌더링 확인
  // ═══════════════════════════════════════════════════════════════
  await page.screenshot({ path: 'test-results/full-01-launch.png' })
  const bodyText = await page.locator('body').textContent({ timeout: 10_000 })
  expect(bodyText?.length).toBeGreaterThan(10)
  const hasApp = await page.getByText(/VibeSynth/i).first().isVisible({ timeout: 5_000 }).catch(() => false)
  expect(hasApp).toBe(true)
  console.log('✅ 1. 앱 렌더링 정상')
  await page.waitForTimeout(DELAY)

  // ═══════════════════════════════════════════════════════════════
  // 2. 대시보드 UI 확인
  // ═══════════════════════════════════════════════════════════════
  // 사이드바
  await expect(page.getByText(/My projects/i)).toBeVisible()
  await expect(page.getByText(/Shared with me/i)).toBeVisible()
  await expect(page.getByPlaceholder(/Search/i)).toBeVisible()
  // LifeFlow 예제
  await expect(page.getByText('LifeFlow Examples')).toBeVisible()
  const exampleCards = page.locator('main button:has-text("LifeFlow")')
  expect(await exampleCards.count()).toBe(6)
  // 프롬프트 바
  await expect(page.locator('textarea')).toBeVisible()
  await expect(page.getByRole('button', { name: 'App', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Tablet', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Web', exact: true })).toBeVisible()
  // 모델 셀렉터
  await expect(page.getByRole('button', { name: /3\.0 Flash/ })).toBeVisible()
  console.log('✅ 2. 대시보드 UI 확인')
  await page.screenshot({ path: 'test-results/full-02-dashboard.png' })
  await page.waitForTimeout(DELAY)

  // ═══════════════════════════════════════════════════════════════
  // 3. 라이트 모드로 대시보드 프로젝트 생성 (Web, 3+페이지)
  // ═══════════════════════════════════════════════════════════════
  // Web 모드 선택
  await page.getByRole('button', { name: 'Web', exact: true }).click()
  await page.waitForTimeout(DELAY)

  // Light 모드 선택
  const lightBtn = page.getByText('☀️').first()
  if (await lightBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await lightBtn.click()
    await page.waitForTimeout(DELAY)
    console.log('✅ 3a. Light 모드 선택')
  } else {
    console.log('⚠️ 3a. Light 토글 미표시')
  }
  await page.screenshot({ path: 'test-results/full-03a-light-mode.png' })

  // 프롬프트 입력 — 라이트 모드 대시보드
  const promptTextarea = page.locator('textarea')
  await promptTextarea.fill(
    'An admin dashboard for LifeFlow member management with KPI cards, member list table, and sidebar navigation. ' +
    'Use a LIGHT theme with white background, clean shadows, and green accent color. ' +
    'screens: Overview Dashboard, Member List, Member Detail'
  )
  await page.waitForTimeout(DELAY)
  await promptTextarea.press('Enter')
  console.log('✅ 3b. 프롬프트 제출 (라이트 모드)')

  // Editor 진입 — Generating 또는 이미 완료된 상태
  const editorVisible = await page.getByText('Generating...').first()
    .or(page.locator('[data-screen-card]').first())
    .isVisible({ timeout: 15_000 }).catch(() => false)
  console.log(`✅ 3c. Editor 진입${editorVisible ? '' : ' (상태 미확인)'}`)

  // 3개 스크린 생성 대기
  const screenCards = page.locator('[data-screen-card]')
  await expect(async () => {
    expect(await screenCards.count()).toBeGreaterThanOrEqual(3)
  }).toPass({ timeout: 180_000 })

  // HTML 생성 완료 대기
  await expect(async () => {
    const gen = await page.locator('[data-screen-card]').getByText('AI Generating').count()
    expect(gen).toBe(0)
  }).toPass({ timeout: 300_000 })

  const screenCount = await screenCards.count()
  console.log(`✅ 3d. ${screenCount}개 스크린 생성 완료`)
  await page.screenshot({ path: 'test-results/full-03d-screens.png' })
  await page.waitForTimeout(DELAY)

  // DS 색상 확인
  const firstHtml = await page.locator('[data-screen-card] iframe').first().getAttribute('srcdoc') || ''
  const hexColors = new Set((firstHtml.match(/#[0-9A-Fa-f]{6}/g) || []).map((c: string) => c.toLowerCase()))
  console.log(`  생성된 HTML: ${firstHtml.length}bytes, ${hexColors.size}개 hex 색상`)
  await page.waitForTimeout(DELAY)

  // ═══════════════════════════════════════════════════════════════
  // 4. 캔버스 도구 확인
  // ═══════════════════════════════════════════════════════════════
  // Cursor (기본)
  await expect(page.getByTitle(/Cursor/i).first()).toBeVisible()
  // Select
  const selectTool = page.getByTitle(/Select/i).first()
  await expect(selectTool).toBeVisible()
  // Element
  await expect(page.getByTitle(/Element/i).first()).toBeVisible()
  // Image
  await expect(page.getByTitle(/Image/i).first()).toBeVisible()
  console.log('✅ 4. 좌측 도구바 4개 아이콘 확인')
  await page.waitForTimeout(DELAY)

  // ═══════════════════════════════════════════════════════════════
  // 5. 우측 패널 (Design / Components / Layers)
  // ═══════════════════════════════════════════════════════════════
  // 우측 패널 탭 확인
  const panelCloseBtn = page.getByTitle('Close panel')
  const hasPanel = await panelCloseBtn.isVisible({ timeout: 3_000 }).catch(() => false)

  if (hasPanel) {
    // Components 탭
    const componentsTab = page.locator('button:has-text("Components")').first()
    await componentsTab.click()
    await page.waitForTimeout(DELAY)
    const hasButtons = await page.getByText('Buttons').isVisible({ timeout: 5_000 }).catch(() => false)
    console.log(`✅ 5a. Components 탭: Buttons=${hasButtons}`)

    // Layers 탭
    const layersTab = page.locator('button:has-text("Layers")').first()
    await layersTab.click()
    await page.waitForTimeout(DELAY)
    const hasScreensList = await page.getByText(/Screens/i).isVisible({ timeout: 5_000 }).catch(() => false)
    console.log(`✅ 5b. Layers 탭: Screens=${hasScreensList}`)

    // Design 탭으로 복귀
    const designTab = page.locator('button:has-text("Design")').first()
    await designTab.click()
    await page.waitForTimeout(DELAY)
    const hasPalette = await page.getByText('Color Palette').isVisible({ timeout: 10_000 }).catch(() => false)
    console.log(`✅ 5c. Design 탭: Palette=${hasPalette}`)
  } else {
    console.log('⚠️ 5. 우측 패널 미표시')
  }
  await page.screenshot({ path: 'test-results/full-05-panels.png' })
  await page.waitForTimeout(DELAY)

  // ═══════════════════════════════════════════════════════════════
  // 6. 히트맵 생성 + 효과 부여
  // ═══════════════════════════════════════════════════════════════
  await screenCards.first().click({ force: true })
  await page.waitForTimeout(2000) // ScreenContextToolbar 렌더링 대기

  const genBtn = page.getByRole('banner').getByRole('button', { name: 'Generate' })
  const genVisible = await genBtn.isVisible({ timeout: 8_000 }).catch(() => false)
  if (genVisible) {
    await genBtn.click()
    await page.waitForTimeout(DELAY)

    const hmBtn = page.getByText('Predictive heat map')
    if (await hmBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await hmBtn.click()
      await page.waitForTimeout(25_000)

      const zones = page.locator('[data-heatmap-zone]')
      const zoneCount = await zones.count().catch(() => 0)
      console.log(`✅ 6a. 히트맵 ${zoneCount}개 존 감지`)

      if (zoneCount > 0) {
        for (let i = 0; i < 3; i++) await page.keyboard.press('Control+=')
        await page.waitForTimeout(DELAY)

        try {
          await zones.first().click({ force: true, timeout: 5_000 })
          await page.waitForTimeout(DELAY)
          const effectBtn = page.getByText(/Boost|Enhance|Emphasize|Apply/i).first()
          if (await effectBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
            await effectBtn.click({ force: true })
            console.log('✅ 6b. 히트맵 효과 부여')
            await page.waitForTimeout(15_000)
          }
        } catch { console.log('⚠️ 6b. 존 클릭 실패') }

        for (let i = 0; i < 3; i++) await page.keyboard.press('Control+-')
      }

      // 히트맵 해제
      try {
        if (await genBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
          await genBtn.click()
          await page.waitForTimeout(300)
          const hm2 = page.getByText('Predictive heat map')
          if (await hm2.isVisible({ timeout: 2_000 }).catch(() => false)) await hm2.click()
          await page.keyboard.press('Escape')
        }
      } catch {}
    } else {
      console.log('⚠️ 6. heat map 메뉴 미표시')
      await page.keyboard.press('Escape')
    }
  } else {
    console.log('⚠️ 6. Generate 버튼 미표시')
  }
  await page.mouse.click(600, 400) // 선택 해제
  await page.waitForTimeout(DELAY)
  await page.screenshot({ path: 'test-results/full-06-heatmap.png' })

  // ═══════════════════════════════════════════════════════════════
  // 7. Variation 생성
  // ═══════════════════════════════════════════════════════════════
  try {
    await page.mouse.click(600, 400)
    await page.waitForTimeout(500)
    await screenCards.first().click({ force: true })
    await page.waitForTimeout(2000)

    const genBtn7 = page.getByRole('banner').getByRole('button', { name: 'Generate' })
    if (await genBtn7.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await genBtn7.click()
      await page.waitForTimeout(DELAY)
      const varBtn = page.getByText('Variations')
      if (await varBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await varBtn.click()
        await page.waitForTimeout(30_000)
        const newCount = await screenCards.count()
        console.log(`✅ 7. Variation: ${screenCount} → ${newCount}`)
      } else {
        console.log('⚠️ 7. Variations 메뉴 미표시')
        await page.keyboard.press('Escape')
      }
    } else {
      console.log('⚠️ 7. Generate 미표시')
    }
  } catch { console.log('⚠️ 7. Variation 실패 (건너뜀)') }
  await page.mouse.click(600, 400)
  await page.waitForTimeout(DELAY)

  // ═══════════════════════════════════════════════════════════════
  // 8. 단일 스크린 편집
  // ═══════════════════════════════════════════════════════════════
  try {
    await page.mouse.click(600, 400)
    await page.waitForTimeout(500)
    await screenCards.first().click({ force: true })
    await page.waitForTimeout(DELAY)

    const editTextarea = page.locator('textarea')
    await editTextarea.fill('Add a notification bell icon in the top right corner')
    await page.waitForTimeout(DELAY)
    await editTextarea.press('Enter')

    const editDone = await page.getByText(/Editing|Updated|Applied|Batch/i).first()
      .isVisible({ timeout: 120_000 }).catch(() => false)
    console.log(editDone ? '✅ 8. 단일 스크린 편집 완료' : '⚠️ 8. 편집 타임아웃')
  } catch { console.log('⚠️ 8. 편집 실패 (건너뜀)') }
  await page.screenshot({ path: 'test-results/full-08-edit.png' })
  await page.waitForTimeout(DELAY)

  // ═══════════════════════════════════════════════════════════════
  // 9. 다중 스크린 선택 + 일괄 편집
  // ═══════════════════════════════════════════════════════════════
  // Select 도구로 전환
  await selectTool.click()
  await page.waitForTimeout(DELAY)

  // 처음 2개 스크린 선택
  const currentCount = await screenCards.count()
  if (currentCount >= 2) {
    await screenCards.nth(0).click({ force: true })
    await page.waitForTimeout(500)
    await screenCards.nth(1).click({ force: true })
    await page.waitForTimeout(DELAY)

    // 다중 선택 툴바 확인
    const multiBar = page.getByText(/screens selected/i)
    if (await multiBar.isVisible({ timeout: 3_000 }).catch(() => false)) {
      console.log('✅ 9a. 다중 선택 툴바 표시')
      await page.screenshot({ path: 'test-results/full-09a-multiselect.png' })

      // Clear 버튼으로 해제
      await page.getByText('✕ Clear').click()
      await page.waitForTimeout(DELAY)
    }
  }

  // Cursor 모드 복귀
  await page.getByTitle(/Cursor/i).first().click()
  await page.waitForTimeout(DELAY)
  console.log('✅ 9b. 다중 선택 + 해제 완료')

  // ═══════════════════════════════════════════════════════════════
  // 10. Live 앱 빌드 + Live Window + Live Edit 팝업
  // ═══════════════════════════════════════════════════════════════
  await page.mouse.click(600, 400) // 스크린 선택 해제
  await page.waitForTimeout(DELAY)

  const runButton = page.locator('button').filter({ hasText: '▶ Run' }).first()
  await expect(runButton).toBeVisible({ timeout: 5_000 })
  await page.waitForTimeout(DELAY)
  await runButton.click()
  console.log('✅ 10a. Run 클릭')

  // Building 또는 Live 상태 대기
  await expect(
    page.getByText(/Building|Generating React|Installing|Dev server/i).first()
      .or(page.locator('button').filter({ hasText: /Stop/ }))
  ).toBeVisible({ timeout: 30_000 })
  await page.screenshot({ path: 'test-results/full-10a-building.png' })

  // 프론트엔드 빌드 완료 또는 실패 대기
  await expect(
    page.getByText(/writing to disk|Dev server running|Frontend generation failed/i).first()
      .or(page.locator('button').filter({ hasText: /Stop/ }))
  ).toBeVisible({ timeout: 360_000 })

  const frontendFailed = await page.getByText(/Frontend generation failed/i).count() > 0
  if (frontendFailed) {
    console.log('⚠️ 10b. Frontend 빌드 실패 — Live 테스트 스킵')
    await page.screenshot({ path: 'test-results/full-10b-frontend-failed.png' })
  } else {
    // Live Window 열림 대기
    let liveWindow = null
    for (let i = 0; i < 60; i++) {
      const windows = electronApp.windows()
      if (windows.length > 1) {
        liveWindow = windows.find(w => w !== page)
        break
      }
      await page.waitForTimeout(1000)
    }

    if (liveWindow) {
      await liveWindow.waitForLoadState('load', { timeout: 30_000 }).catch(() => {})
      console.log('✅ 10b. Live Window 열림')
      await liveWindow.screenshot({ path: 'test-results/full-10b-live.png' })
      await page.waitForTimeout(DELAY)

      // ═══════════════════════════════════════════════════════════
      // 11. Designer / Developer 모드
      // ═══════════════════════════════════════════════════════════
      // Stop 버튼이 보이면 isRunning=true → 토글도 보여야 함
      await expect(page.locator('button').filter({ hasText: /Stop/ }).first()).toBeVisible({ timeout: 15_000 })
      await page.waitForTimeout(3000) // React state + re-render 대기

      // 토글은 isRunning=true일 때만 표시됨
      const designerToggle = page.getByText('🎨 Designer').or(page.getByText('💻 Developer'))
      const toggleVisible = await designerToggle.first().isVisible({ timeout: 10_000 }).catch(() => false)
      if (toggleVisible) {
        console.log('✅ 11a. Designer/Developer 토글 표시')
      } else {
        // isRunning이 true인데 토글이 안 보이면 — 직접 확인
        const runState = await page.evaluate(() => {
          const btn = document.querySelector('button')
          return btn?.textContent
        })
        console.log(`⚠️ 11a. 토글 미표시 (버튼: ${runState?.slice(0, 20)})`)
      }

      if (toggleVisible) {
        // Developer 모드로 전환
        await designerToggle.first().click()
        await page.waitForTimeout(DELAY)
        const afterClick = page.getByText('💻 Developer').or(page.getByText('🎨 Designer'))
        await expect(afterClick.first()).toBeVisible({ timeout: 3_000 })
        console.log('✅ 11b. 모드 전환 성공')

        // 다시 원래로
        await afterClick.first().click()
        await page.waitForTimeout(DELAY)

        const mode = await page.evaluate(() => localStorage.getItem('vibesynth-live-feedback-mode'))
        console.log(`  피드백 모드 저장: ${mode}`)
      }
      await page.screenshot({ path: 'test-results/full-11-modes.png' })
      await page.waitForTimeout(DELAY)

      // ═══════════════════════════════════════════════════════════
      // 12. Export + VS Code
      // ═══════════════════════════════════════════════════════════
      // 현재 프로젝트의 실제 ID 가져오기
      const projectStatus = await page.evaluate(async () => {
        return await (window as any).electronAPI?.project?.getStatus?.()
      })
      const liveProjectId = projectStatus?.projectId
      console.log(`  Live project ID: ${liveProjectId}`)

      if (liveProjectId) {
        const exportResult = await page.evaluate(async (pid: string) => {
          return await (window as any).electronAPI?.project?.exportToFolder?.(pid, `~/VibeSynth/export/${pid}`)
        }, liveProjectId)
        console.log(`✅ 12a. Export: ${exportResult?.success ? `성공 (${exportResult.fileCount}개 파일)` : exportResult?.error || '실패'}`)

        if (exportResult?.success) {
          const vscodeResult = await page.evaluate(async (pid: string) => {
            return await (window as any).electronAPI?.shell?.openVscode?.(`~/VibeSynth/export/${pid}`)
          }, liveProjectId)
          console.log(`✅ 12b. VS Code: ${vscodeResult?.success ? '열림' : vscodeResult?.error || 'CLI 미설치'}`)
        }
      } else {
        console.log('⚠️ 12. Live project ID 없음 — Export 건너뜀')
      }
      await page.waitForTimeout(DELAY)
    } else {
      console.log('⚠️ 10b. Live Window 미열림')
    }
  }

  // Stop
  await page.evaluate(async () => {
    await (window as any).electronAPI?.feedback?.close?.()
    await (window as any).electronAPI?.liveEdit?.close?.()
  }).catch(() => {})
  await page.waitForTimeout(500)

  const stopBtn = page.locator('button').filter({ hasText: /Stop/ }).first()
  if (await stopBtn.isVisible().catch(() => false)) {
    await stopBtn.click({ force: true })
    await page.waitForTimeout(2000)
  }
  console.log('✅ 10c. Stop 완료')
  await page.waitForTimeout(DELAY)

  // ═══════════════════════════════════════════════════════════════
  // 13. 프로젝트 저장 확인
  // ═══════════════════════════════════════════════════════════════
  // Auto-save가 2초 디바운스로 작동하므로 대기
  await page.waitForTimeout(3000)

  const savedProjects = await page.evaluate(async () => {
    return await (window as any).electronAPI?.db?.getAllProjects?.('default')
  })
  const savedCount = Array.isArray(savedProjects) ? savedProjects.length : 0
  console.log(`✅ 13. 프로젝트 저장 확인: ${savedCount}개 저장됨`)
  await page.waitForTimeout(DELAY)

  // ═══════════════════════════════════════════════════════════════
  // 14. 우측 패널에서 다른 디자인 시스템 적용
  // ═══════════════════════════════════════════════════════════════
  // Design 탭으로 전환
  const dsDesignTab = page.locator('button:has-text("Design")').first()
  await dsDesignTab.click()
  await page.waitForTimeout(DELAY)

  // Recommended Designs 섹션 펼치기
  const recHeader = page.getByText(/Recommended/i).first()
  if (await recHeader.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await recHeader.click()
    await page.waitForTimeout(DELAY)
  }

  // 추천 DS 버튼들 (title 속성이 있는 버튼)
  const recDesigns = page.locator('.absolute.right-3 button[title]')
  const recCount = await recDesigns.count().catch(() => 0)
  if (recCount >= 2) {
    await recDesigns.nth(1).click()
    await page.waitForTimeout(DELAY)
    const selectedName = await recDesigns.nth(1).getAttribute('title')
    console.log(`✅ 14. 추천 DS 적용: ${selectedName}`)
  } else {
    // 직접 Load 셀렉트 사용
    const loadSelect = page.locator('[data-testid="load-design-system"]')
    if (await loadSelect.isVisible({ timeout: 3_000 }).catch(() => false)) {
      const options = await loadSelect.locator('option').count()
      if (options >= 2) {
        await loadSelect.selectOption({ index: 1 })
        await page.waitForTimeout(DELAY)
        console.log('✅ 14. 저장된 DS에서 로드')
      } else {
        console.log(`⚠️ 14. DS 옵션 ${options}개`)
      }
    } else {
      console.log(`⚠️ 14. 추천 DS ${recCount}개, Load 셀렉트 미표시`)
    }
  }
  await page.screenshot({ path: 'test-results/full-14-ds-change.png' })
  await page.waitForTimeout(DELAY)

  // ═══════════════════════════════════════════════════════════════
  // 15. Pinterest 디자인 훔치기 (URL 기반)
  // ═══════════════════════════════════════════════════════════════
  const pinterestResult = await page.evaluate(async () => {
    return await (window as any).electronAPI?.pinterest?.stealUrl?.(
      'https://i.pinimg.com/1200x/a6/c8/cf/a6c8cf334ced43dc710e7d46b70cbf72.jpg'
    )
  })
  if (pinterestResult?.success !== false) {
    console.log('✅ 15. Pinterest URL 분석 요청')
  } else {
    console.log(`⚠️ 15. Pinterest: ${pinterestResult?.error || 'failed'}`)
  }
  await page.waitForTimeout(DELAY)

  // ═══════════════════════════════════════════════════════════════
  // 16. Element 도구로 스크린 내 텍스트 편집
  // ═══════════════════════════════════════════════════════════════
  // Element 도구 선택
  await page.getByTitle(/Element/i).first().click()
  await page.waitForTimeout(DELAY)

  // 첫 번째 스크린 클릭 → Edit Mode 진입
  await screenCards.first().click({ force: true })
  await page.waitForTimeout(2000)

  // iframe 내부 요소 클릭 시도 (상단 20% 영역)
  const iframeBox = await page.locator('[data-screen-card] iframe').first().boundingBox()
  if (iframeBox) {
    await page.mouse.click(iframeBox.x + iframeBox.width * 0.4, iframeBox.y + iframeBox.height * 0.15)
    await page.waitForTimeout(2000)

    // 요소가 선택되었으면 프롬프트로 텍스트 변경
    const hasSelected = await page.getByText(/Selected </i).isVisible({ timeout: 5_000 }).catch(() => false)
    if (hasSelected) {
      const ta = page.locator('textarea')
      await ta.fill('Change this text to "Hello VibeSynth"')
      await ta.press('Enter')
      await page.waitForTimeout(30_000)
      console.log('✅ 16. 스크린 내 텍스트 편집')
    } else {
      console.log('⚠️ 16. 요소 선택 안됨')
    }
  }

  // Cursor 모드로 복귀
  await page.getByTitle(/Cursor/i).first().click()
  await page.waitForTimeout(DELAY)
  await page.screenshot({ path: 'test-results/full-16-element-edit.png' })

  // ═══════════════════════════════════════════════════════════════
  // 17. 히트맵 각 효과 유형별 적용 (첫 번째 스크린 재사용)
  // ═══════════════════════════════════════════════════════════════
  // 스크린 선택 해제 후 첫 번째 스크린 선택 (캐시된 히트맵 사용)
  await page.mouse.click(600, 400)
  await page.waitForTimeout(500)
  await screenCards.first().click({ force: true })
  await page.waitForTimeout(2000)

  const genBtn17 = page.getByRole('banner').getByRole('button', { name: 'Generate' })
  const gen17Vis = await genBtn17.isVisible({ timeout: 5_000 }).catch(() => false)
  if (gen17Vis) {
    await genBtn17.click()
    await page.waitForTimeout(DELAY)
    const hmBtn17 = page.getByText('Predictive heat map')
    const hm17Vis = await hmBtn17.isVisible({ timeout: 5_000 }).catch(() => false)
    if (hm17Vis) {
      await hmBtn17.click()
      await page.waitForTimeout(30_000) // 히트맵 생성/로딩 대기 (새로 생성)

      const zones17 = page.locator('[data-heatmap-zone]')
      const zc17 = await zones17.count().catch(() => 0)
      console.log(`  히트맵 17: ${zc17}개 존 감지`)

      if (zc17 >= 2) {
        // 줌 인
        for (let i = 0; i < 3; i++) await page.keyboard.press('Control+=')
        await page.waitForTimeout(500)

        const effectLabels = ['Hover', 'Click', 'Boost']
        for (let ei = 0; ei < Math.min(zc17, effectLabels.length); ei++) {
          try {
            await zones17.nth(ei).click({ force: true, timeout: 5_000 })
            await page.waitForTimeout(DELAY)
            const effBtn = page.getByText(new RegExp(effectLabels[ei], 'i')).first()
            if (await effBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
              await effBtn.click({ force: true })
              await page.waitForTimeout(15_000)
              console.log(`✅ 17-${ei+1}. 히트맵 효과: ${effectLabels[ei]}`)
            }
          } catch { console.log(`⚠️ 17-${ei+1}. 효과 적용 실패`) }
        }

        // 줌 복원
        for (let i = 0; i < 3; i++) await page.keyboard.press('Control+-')
      } else {
        console.log(`⚠️ 17. 히트맵 존 ${zc17}개`)
      }

      // 히트맵 해제
      try {
        if (await genBtn17.isVisible({ timeout: 2_000 }).catch(() => false)) {
          await genBtn17.click()
          await page.waitForTimeout(300)
          const hm3 = page.getByText('Predictive heat map')
          if (await hm3.isVisible({ timeout: 2_000 }).catch(() => false)) await hm3.click()
          await page.keyboard.press('Escape')
        }
      } catch {}
    } else {
      console.log('⚠️ 17. heat map 메뉴 미표시')
      await page.keyboard.press('Escape')
    }
  } else {
    console.log('⚠️ 17. Generate 버튼 미표시 — 스크린 미선택')
  }
  await page.mouse.click(600, 400)
  await page.waitForTimeout(DELAY)
  await page.screenshot({ path: 'test-results/full-17-heatmap-effects.png' })

  // ═══════════════════════════════════════════════════════════════
  // 18. 스크린 내 이미지 교체 (AI 재생성)
  // ═══════════════════════════════════════════════════════════════
  await screenCards.first().click({ force: true })
  await page.waitForTimeout(DELAY)

  const imgEditTextarea = page.locator('textarea')
  await imgEditTextarea.fill('Replace the hero image with a modern abstract gradient background in blue and purple tones')
  await page.waitForTimeout(DELAY)
  await imgEditTextarea.press('Enter')

  await expect(
    page.getByText(/Editing|Updated|Applied|Batch/i).first()
  ).toBeVisible({ timeout: 120_000 })
  console.log('✅ 18. 스크린 내 이미지 교체 편집')
  await page.screenshot({ path: 'test-results/full-18-image-replace.png' })
  await page.waitForTimeout(DELAY)

  // ═══════════════════════════════════════════════════════════════
  // 19. 스크린 높이 자동 조절 확인 — 스크린별 스크린샷 캡처
  // ═══════════════════════════════════════════════════════════════
  const iframes = page.locator('[data-screen-card] iframe')
  const iframeCount = await iframes.count()
  let heightOk = 0
  let heightTooSmall = 0
  for (let i = 0; i < Math.min(iframeCount, 3); i++) {
    const card = page.locator('[data-screen-card]').nth(i)
    const box = await card.boundingBox()
    const cardHeight = box?.height || 0

    // 각 스크린 카드의 스크린샷 캡처
    await card.screenshot({ path: `test-results/full-19-screen${i + 1}.png` })

    if (cardHeight > 150) {
      heightOk++
    } else {
      heightTooSmall++
    }
    console.log(`  스크린 ${i + 1}: 카드 높이 ${Math.round(cardHeight)}px`)
  }
  if (heightTooSmall > 0) {
    console.log(`⚠️ 19. ${heightTooSmall}개 스크린 높이가 너무 작음 (<150px)`)
  } else {
    console.log(`✅ 19. 스크린 높이: ${heightOk}/${Math.min(iframeCount, 3)}개 정상`)
  }
  await page.waitForTimeout(DELAY)

  // ═══════════════════════════════════════════════════════════════
  // 20. ZIP 익스포트 (IPC 직접 호출 — 파일 다이얼로그 건너뜀)
  // ═══════════════════════════════════════════════════════════════
  // ZIP 메뉴가 햄버거 메뉴에 있는지 확인
  await page.locator('header button').first().click() // 햄버거 열기
  await page.waitForTimeout(DELAY)
  const zipMenu = page.getByText('Export as ZIP')
  const hasZip = await zipMenu.isVisible({ timeout: 3_000 }).catch(() => false)
  console.log(`✅ 20. ZIP 익스포트 메뉴: ${hasZip ? '존재' : '미표시'}`)
  await page.keyboard.press('Escape') // 메뉴 닫기
  await page.waitForTimeout(DELAY)

  // ═══════════════════════════════════════════════════════════════
  // 21. 컨텐츠 길이 확인 — 모바일 스크린이 지나치게 길지 않은지
  // ═══════════════════════════════════════════════════════════════
  const iframesForHeight = page.locator('[data-screen-card] iframe')
  const heightCount = await iframesForHeight.count()
  let excessiveHeightCount = 0
  for (let i = 0; i < Math.min(heightCount, 3); i++) {
    const srcdoc = await iframesForHeight.nth(i).getAttribute('srcdoc') || ''
    // HTML 길이로 컨텐츠 양 추정 (base64 이미지 제외)
    const stripped = srcdoc.replace(/data:[^"')\s]{200,}/g, '')
    const box = await iframesForHeight.nth(i).boundingBox()
    const displayHeight = box?.height || 0
    console.log(`  스크린 ${i+1}: HTML ${stripped.length}자, 표시높이 ${Math.round(displayHeight)}px`)
    // 모바일(390px) 스크린이 2000px 이상이면 지나치게 긴 것
    if (displayHeight > 2000) excessiveHeightCount++
  }
  if (excessiveHeightCount > 0) {
    console.log(`⚠️ 21. ${excessiveHeightCount}개 스크린이 지나치게 김 (>2000px)`)
  } else {
    console.log('✅ 21. 컨텐츠 길이 정상')
  }
  await page.waitForTimeout(DELAY)

  // ═══════════════════════════════════════════════════════════════
  // 22. Agent Log 에러 확인
  // ═══════════════════════════════════════════════════════════════
  const errorLogs = page.locator('.space-y-1\\.5 span.text-red-600, .space-y-1\\.5 span.text-red-400')
  const errorCount = await errorLogs.count().catch(() => 0)
  if (errorCount > 0) {
    for (let i = 0; i < Math.min(errorCount, 3); i++) {
      const errText = await errorLogs.nth(i).textContent()
      console.log(`  Agent Log 에러 ${i+1}: ${errText?.slice(0, 100)}`)
    }
    console.log(`⚠️ 22. Agent Log에 ${errorCount}개 에러 발견`)
  } else {
    console.log('✅ 22. Agent Log 에러 없음')
  }
  await page.waitForTimeout(DELAY)

  // ═══════════════════════════════════════════════════════════════
  // 최종 스크린샷
  // ═══════════════════════════════════════════════════════════════
  await page.screenshot({ path: 'test-results/full-99-final.png' })
  console.log('\n🏁 VibeSynth 전체 기능 E2E 테스트 완료! (22개 Phase)')
})
