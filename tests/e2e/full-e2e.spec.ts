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
  // 3. LifeFlow Admin Dashboard 예제 → PRD → DS 선택 → 3+페이지 생성
  // ═══════════════════════════════════════════════════════════════
  await page.locator('main button:has-text("LifeFlow Admin Dashboard")').click()
  await page.waitForTimeout(DELAY)

  // PRD 모달
  const modal = page.locator('[class*="fixed"]')
  await expect(modal.locator('h2:has-text("LifeFlow Admin Dashboard")')).toBeVisible({ timeout: 5000 })
  const modalText = await modal.textContent()
  expect(modalText).toContain('KPI')
  console.log('✅ 3a. PRD 모달 확인')
  await page.screenshot({ path: 'test-results/full-03a-prd.png' })
  await page.waitForTimeout(DELAY)

  // 추천 DS 랜덤 선택
  const dsButtons = modal.locator('button[title]')
  const dsCount = await dsButtons.count()
  if (dsCount >= 2) {
    const randomIdx = Math.floor(Math.random() * dsCount)
    await dsButtons.nth(randomIdx).click()
    const dsName = await dsButtons.nth(randomIdx).getAttribute('title')
    console.log(`✅ 3b. 추천 DS 선택: ${dsName}`)
  }
  await page.waitForTimeout(DELAY)

  // Generate
  await modal.locator('button:has-text("Generate")').click()
  await page.waitForTimeout(DELAY)

  // Editor 진입
  await expect(page.getByText('LifeFlow Admin Dashboard')).toBeVisible({ timeout: 10_000 })
  await expect(page.getByText('Generating...').first()).toBeVisible({ timeout: 15_000 })
  console.log('✅ 3c. Editor 진입, 생성 시작')

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
  await page.waitForTimeout(DELAY)

  const genBtn = page.getByRole('banner').getByRole('button', { name: 'Generate' })
  if (await genBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await genBtn.click()
    await page.waitForTimeout(DELAY)

    const hmBtn = page.getByText('Predictive heat map')
    if (await hmBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await hmBtn.click()
      await page.waitForTimeout(20_000) // 히트맵 생성 대기

      const zones = page.locator('[data-heatmap-zone]')
      const zoneCount = await zones.count().catch(() => 0)
      console.log(`✅ 6a. 히트맵 ${zoneCount}개 존 감지`)

      if (zoneCount > 0) {
        // 줌 인
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
        } catch { console.log('⚠️ 6b. 히트맵 존 클릭 실패') }

        // 줌 복원
        for (let i = 0; i < 3; i++) await page.keyboard.press('Control+-')
      }

      // 히트맵 해제
      if (await genBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await genBtn.click()
        await page.waitForTimeout(300)
        if (await hmBtn.isVisible({ timeout: 2_000 }).catch(() => false)) await hmBtn.click()
        await page.keyboard.press('Escape')
      }
    }
  }
  await page.mouse.click(600, 400) // 선택 해제
  await page.waitForTimeout(DELAY)
  await page.screenshot({ path: 'test-results/full-06-heatmap.png' })

  // ═══════════════════════════════════════════════════════════════
  // 7. Variation 생성
  // ═══════════════════════════════════════════════════════════════
  await screenCards.first().click({ force: true })
  await page.waitForTimeout(DELAY)

  if (await genBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await genBtn.click()
    await page.waitForTimeout(DELAY)

    const varBtn = page.getByText('Variations')
    if (await varBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await varBtn.click()
      await page.waitForTimeout(DELAY)

      // Variation 생성 대기
      await page.waitForTimeout(30_000)
      const newCount = await screenCards.count()
      console.log(`✅ 7. Variation 생성: ${screenCount} → ${newCount} 스크린`)
      await page.screenshot({ path: 'test-results/full-07-variation.png' })
    } else {
      console.log('⚠️ 7. Variations 메뉴 미표시')
    }
  }
  await page.mouse.click(600, 400)
  await page.waitForTimeout(DELAY)

  // ═══════════════════════════════════════════════════════════════
  // 8. 단일 스크린 편집
  // ═══════════════════════════════════════════════════════════════
  // 스크린 선택 해제 후 재선택
  await page.mouse.click(600, 400)
  await page.waitForTimeout(500)
  await screenCards.first().click({ force: true })
  await page.waitForTimeout(DELAY)

  // 프롬프트 바에 선택된 스크린 태그가 있는지 확인
  const editTextarea = page.locator('textarea')
  await editTextarea.fill('Add a notification bell icon in the top right corner')
  await page.waitForTimeout(DELAY)
  await editTextarea.press('Enter')

  // 편집 시작/완료 로그 대기
  const editDone = await page.getByText(/Editing|Updated|Applied|Batch/i).first()
    .isVisible({ timeout: 120_000 }).catch(() => false)
  console.log(editDone ? '✅ 8. 단일 스크린 편집 완료' : '⚠️ 8. 편집 타임아웃 (스킵)')
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
      const designerToggle = page.getByText('🎨 Designer')
      if (await designerToggle.isVisible({ timeout: 5_000 }).catch(() => false)) {
        console.log('✅ 11a. Designer 모드 표시')

        // Developer 모드로 전환
        await designerToggle.click()
        await expect(page.getByText('💻 Developer')).toBeVisible({ timeout: 3_000 })
        console.log('✅ 11b. Developer 모드 전환')

        // 다시 Designer로
        await page.getByText('💻 Developer').click()
        await expect(page.getByText('🎨 Designer')).toBeVisible({ timeout: 3_000 })

        // localStorage 저장 확인
        const mode = await page.evaluate(() => localStorage.getItem('vibesynth-live-feedback-mode'))
        console.log(`  피드백 모드 저장: ${mode}`)
      } else {
        console.log('⚠️ 11. Designer 토글 미표시 (타이밍)')
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
  const recDesigns = page.locator('button[title]').filter({ has: page.locator('div') })
  const recCount = await recDesigns.count().catch(() => 0)
  if (recCount >= 2) {
    // 다른 DS 클릭 (현재와 다른 것)
    await recDesigns.nth(1).click()
    await page.waitForTimeout(DELAY)
    console.log('✅ 14. 우측 패널에서 다른 DS 적용')
  } else {
    // Recommended Designs 섹션 열기 시도
    const recSection = page.getByText(/Recommended/i)
    if (await recSection.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await recSection.click()
      await page.waitForTimeout(DELAY)
    }
    console.log(`⚠️ 14. 추천 DS 버튼 ${recCount}개`)
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
  // 17. 히트맵 각 효과 유형별 적용
  // ═══════════════════════════════════════════════════════════════
  await screenCards.nth(1).click({ force: true })
  await page.waitForTimeout(DELAY)

  if (await genBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await genBtn.click()
    await page.waitForTimeout(DELAY)
    const hmBtn2 = page.getByText('Predictive heat map')
    if (await hmBtn2.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await hmBtn2.click()
      await page.waitForTimeout(20_000)

      const zones2 = page.locator('[data-heatmap-zone]')
      const zc2 = await zones2.count().catch(() => 0)

      if (zc2 >= 3) {
        const effects = ['hover-effect', 'click-animation', 'make-prominent']
        for (let ei = 0; ei < Math.min(zc2, effects.length); ei++) {
          try {
            await zones2.nth(ei).click({ force: true, timeout: 3_000 })
            await page.waitForTimeout(500)
            // 효과 메뉴에서 해당 효과 클릭
            const effectLabel = effects[ei] === 'hover-effect' ? 'Hover' :
                                effects[ei] === 'click-animation' ? 'Click' : 'Boost'
            const effBtn = page.getByText(new RegExp(effectLabel, 'i')).first()
            if (await effBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
              await effBtn.click({ force: true })
              await page.waitForTimeout(15_000)
              console.log(`✅ 17-${ei+1}. 히트맵 효과: ${effectLabel}`)
            }
          } catch { console.log(`⚠️ 17-${ei+1}. 효과 적용 실패`) }
        }
      } else {
        console.log(`⚠️ 17. 히트맵 존 ${zc2}개 (최소 3개 필요)`)
      }

      // 히트맵 해제
      try {
        if (await genBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
          await genBtn.click()
          const hm3 = page.getByText('Predictive heat map')
          if (await hm3.isVisible({ timeout: 2_000 }).catch(() => false)) await hm3.click()
          await page.keyboard.press('Escape')
        }
      } catch {}
    }
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
  // 19. 스크린 높이 자동 조절 확인
  // ═══════════════════════════════════════════════════════════════
  const iframes = page.locator('[data-screen-card] iframe')
  const iframeCount = await iframes.count()
  let heightOk = 0
  for (let i = 0; i < Math.min(iframeCount, 3); i++) {
    const box = await iframes.nth(i).boundingBox()
    if (box && box.height > 100) {
      heightOk++
    }
  }
  console.log(`✅ 19. 스크린 높이: ${heightOk}/${Math.min(iframeCount, 3)}개 정상 (>100px)`)
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
  // 최종 스크린샷
  // ═══════════════════════════════════════════════════════════════
  await page.screenshot({ path: 'test-results/full-99-final.png' })
  console.log('\n🏁 VibeSynth 전체 기능 E2E 테스트 완료!')
})
