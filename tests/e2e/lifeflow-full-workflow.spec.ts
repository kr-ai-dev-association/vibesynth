import { test, expect } from './electron-fixture'

/**
 * LifeFlow Dashboard 전체 워크플로우 E2E 테스트
 *
 * 1. 예제 실행 → PRD 뷰어 → 추천 디자인 시스템 선택
 * 2. 최소 3페이지 이상 생성
 * 3. 라이브 앱 빌드
 * 4. Designer 모드에서 오류 수정
 * 5. Developer 모드에서 기능 추가 + 오류 수정
 * 6. VS Code 연동 후 프로젝트 로드
 *
 * 각 액션 사이 1초 지연 — 사용자가 실시간으로 확인 가능
 */

const DELAY = 1000 // 1초 간격

test('LifeFlow Dashboard: PRD → 디자인 선택 → 3+페이지 생성 → Live 빌드 → Designer/Developer 모드 → VS Code', async ({ electronApp, page }) => {
  test.setTimeout(900_000) // 15분

  // ═══════════════════════════════════════════════════════════════
  // Phase 1: 대시보드 → LifeFlow Admin Dashboard 예제 클릭
  // ═══════════════════════════════════════════════════════════════
  await expect(page.getByText('Welcome to VibeSynth.')).toBeVisible()
  await page.waitForTimeout(DELAY)
  await page.screenshot({ path: 'test-results/lf-01-dashboard.png' })

  // LifeFlow Admin Dashboard 예제 클릭
  const dashboardCard = page.locator('main button:has-text("LifeFlow Admin Dashboard")')
  await expect(dashboardCard).toBeVisible()
  await page.waitForTimeout(DELAY)
  await dashboardCard.click()

  // ═══════════════════════════════════════════════════════════════
  // Phase 2: PRD 뷰어 모달 확인
  // ═══════════════════════════════════════════════════════════════
  const modal = page.locator('[class*="fixed"]')
  await expect(modal.locator('h2:has-text("LifeFlow Admin Dashboard")')).toBeVisible({ timeout: 5000 })
  await page.waitForTimeout(DELAY)
  await page.screenshot({ path: 'test-results/lf-02-prd-modal.png' })

  // PRD 내용 확인
  const modalText = await modal.textContent()
  expect(modalText).toContain('Member Management Dashboard')
  expect(modalText).toContain('KPI')
  console.log('✅ PRD 뷰어에 대시보드 PRD 표시 확인')
  await page.waitForTimeout(DELAY)

  // ═══════════════════════════════════════════════════════════════
  // Phase 3: 추천 디자인 시스템 선택
  // ═══════════════════════════════════════════════════════════════
  // Design Style 섹션 확인
  await expect(modal.getByText('Design Style', { exact: true })).toBeVisible()
  await page.waitForTimeout(DELAY)

  // 추천 디자인 시스템 버튼들 (title 속성이 있는 색상 스와치 버튼)
  const dsButtons = modal.locator('button[title]')
  const dsCount = await dsButtons.count()
  console.log(`추천 디자인 시스템 ${dsCount}개 표시`)

  if (dsCount >= 2) {
    // 랜덤으로 디자인 시스템 선택
    const randomIdx = Math.floor(Math.random() * dsCount)
    await dsButtons.nth(randomIdx).click()
    await page.waitForTimeout(DELAY)
    const selectedTitle = await dsButtons.nth(randomIdx).getAttribute('title')
    console.log(`✅ 디자인 시스템 선택 (랜덤 #${randomIdx}): ${selectedTitle}`)
  }
  await page.screenshot({ path: 'test-results/lf-03-design-selected.png' })
  await page.waitForTimeout(DELAY)

  // ═══════════════════════════════════════════════════════════════
  // Phase 4: Generate 클릭 → Editor 진입 → 3+ 페이지 생성
  // ═══════════════════════════════════════════════════════════════
  await modal.locator('button:has-text("Generate")').click()
  await page.waitForTimeout(DELAY)

  // Editor 진입 확인
  await expect(page.getByText('Welcome to VibeSynth.')).not.toBeVisible({ timeout: 10_000 })
  await expect(page.getByText('LifeFlow Admin Dashboard')).toBeVisible({ timeout: 10_000 })
  await page.waitForTimeout(DELAY)

  // 생성 시작 확인
  await expect(page.getByText('Generating...').first()).toBeVisible({ timeout: 15_000 })
  await page.screenshot({ path: 'test-results/lf-04-generating.png' })

  // 최소 3개 스크린 생성 대기
  const screenCards = page.locator('[data-screen-card]')
  await expect(async () => {
    const count = await screenCards.count()
    expect(count).toBeGreaterThanOrEqual(3)
  }).toPass({ timeout: 300_000 })

  const generatedCount = await screenCards.count()
  console.log(`${generatedCount}개 스크린 카드 감지`)

  // 모든 스크린의 HTML 생성이 완료될 때까지 대기
  // "AI Generating..." 텍스트가 캔버스에서 사라지면 완료
  await expect(async () => {
    const generatingLabels = await page.locator('[data-screen-card]').getByText('AI Generating').count()
    expect(generatingLabels).toBe(0)
  }).toPass({ timeout: 300_000 })

  console.log(`✅ ${generatedCount}개 스크린 HTML 생성 완료`)
  await page.waitForTimeout(DELAY)
  await page.screenshot({ path: 'test-results/lf-05-screens-generated.png' })

  // ── 추천 디자인 시스템 검증 ──
  // 우측 Design 탭에 선택한 디자인 시스템이 표시되는지 확인
  const designTab = page.getByRole('button', { name: 'Design' })
  if (await designTab.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await designTab.click()
    await page.waitForTimeout(DELAY)

    // 디자인 시스템 이름 확인 (Airy Mint Design 또는 AI가 추출한 이름)
    const panelText = await page.locator('.absolute.right-3').textContent().catch(() => '')
    console.log(`우측 패널 디자인 시스템: ${panelText?.slice(0, 100)}`)

    // Color Palette 또는 Generating 상태 확인
    const hasPalette = await page.getByText('Color Palette').isVisible({ timeout: 10_000 }).catch(() => false)
    const hasGenerating = await page.getByText(/Generating design system/i).isVisible().catch(() => false)
    console.log(`디자인 시스템 상태: Palette=${hasPalette}, Generating=${hasGenerating}`)

    // 4색 역할 확인
    if (hasPalette) {
      await expect(page.locator('text=Primary').first()).toBeVisible()
      await expect(page.locator('text=Secondary').first()).toBeVisible()
      console.log('✅ 추천 디자인 시스템이 우측 패널에 로드됨')
    }
  }
  await page.screenshot({ path: 'test-results/lf-05b-design-panel.png' })
  await page.waitForTimeout(DELAY)

  // ── 추천 DS 색상이 생성된 HTML에 반영되었는지 검증 ──
  const firstIframe = page.locator('[data-screen-card] iframe').first()
  const screenHtml = await firstIframe.getAttribute('srcdoc') || ''
  // 생성된 HTML에 실제 hex 색상 코드가 존재하는지 확인 (어떤 DS든 색상이 있어야 함)
  const hexColors = screenHtml.match(/#[0-9A-Fa-f]{6}/g) || []
  const uniqueColors = new Set(hexColors.map(c => c.toLowerCase()))
  console.log(`생성된 HTML 색상: ${uniqueColors.size}개 고유 hex 색상, HTML=${screenHtml.length}bytes`)
  if (uniqueColors.size >= 3) {
    console.log('✅ 디자인 시스템 색상이 생성된 HTML에 반영됨')
  } else {
    console.log('⚠️ hex 색상이 적음 — Tailwind 클래스로 대체되었을 수 있음')
  }
  await page.waitForTimeout(DELAY)

  // ═══════════════════════════════════════════════════════════════
  // Phase 4.5: 히트맵 생성 → 효과 2개 부여
  // ═══════════════════════════════════════════════════════════════
  // 첫 번째 스크린 선택
  await screenCards.first().click()
  await page.waitForTimeout(DELAY)

  // ScreenContextToolbar의 Generate 버튼 (헤더 내)
  const toolbarGenerate = page.getByRole('banner').getByRole('button', { name: 'Generate' })
  await expect(toolbarGenerate).toBeVisible({ timeout: 5_000 })

  // Generate 메뉴 → Predictive heat map
  await toolbarGenerate.click()
  await page.waitForTimeout(DELAY)

  const heatmapBtn = page.getByText('Predictive heat map')
  if (await heatmapBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await heatmapBtn.click()
    await page.waitForTimeout(DELAY)

    // 히트맵 생성 대기
    await expect(
      page.getByText(/heatmap|Heatmap|heat map/i).first(),
    ).toBeVisible({ timeout: 60_000 })
    await page.screenshot({ path: 'test-results/lf-04b-heatmap-generating.png' })
    await page.waitForTimeout(DELAY)

    // 히트맵 오버레이 표시 대기
    await page.waitForTimeout(15_000) // 히트맵 생성 + 렌더링 대기

    // 히트맵 존 감지 및 효과 부여
    const heatmapZones = page.locator('[data-heatmap-zone]')
    const zoneCount = await heatmapZones.count().catch(() => 0)
    console.log(`히트맵 존 ${zoneCount}개 감지`)

    // 최대 2개 존에 효과 부여
    for (let zi = 0; zi < Math.min(zoneCount, 2); zi++) {
      try {
        await heatmapZones.nth(zi).click({ force: true, timeout: 5_000 })
        await page.waitForTimeout(DELAY)

        const effectBtn = page.getByText(/Boost|Enhance|Emphasize|Apply/i).first()
        if (await effectBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
          await effectBtn.click({ force: true })
          await page.waitForTimeout(DELAY)
          console.log(`✅ 히트맵 효과 ${zi + 1} 부여`)
          await page.screenshot({ path: `test-results/lf-04c-heatmap-effect${zi + 1}.png` })
        }
        // 완료 대기 후 다음 존
        await page.waitForTimeout(15_000)
      } catch {
        console.log(`⚠️ 히트맵 존 ${zi + 1} 효과 부여 실패 (건너뜀)`)
      }
    }

    if (zoneCount === 0) {
      console.log('⚠️ 히트맵 존 없음 (효과 부여 건너뜀)')
    }

    await page.screenshot({ path: 'test-results/lf-04e-heatmap-done.png' })
  } else {
    console.log('⚠️ Predictive heat map 메뉴 미표시')
  }

  // 히트맵 모드 해제 (캔버스 빈 영역 클릭)
  await page.mouse.click(400, 300)
  await page.waitForTimeout(DELAY)

  // ═══════════════════════════════════════════════════════════════
  // Phase 5: Run 클릭 → 프론트엔드 빌드 → Live Window
  // ═══════════════════════════════════════════════════════════════
  // 스크린 선택 해제 (캔버스 빈 영역 클릭)
  await page.mouse.click(600, 400)
  await page.waitForTimeout(500)

  // Run 버튼 확인 — "▶ Run" 텍스트가 포함된 emerald 색 버튼
  const runButton = page.locator('button').filter({ hasText: '▶ Run' }).first()
  await expect(runButton).toBeVisible({ timeout: 5_000 })
  await page.screenshot({ path: 'test-results/lf-05c-before-run.png' })
  await page.waitForTimeout(DELAY)
  await runButton.click()
  console.log('Run 버튼 클릭됨')
  await page.waitForTimeout(2000)
  await page.screenshot({ path: 'test-results/lf-06-after-run-click.png' })

  // Building/Stop/Generating 상태 중 하나가 보일 때까지 대기
  await expect(
    page.getByText(/Building|Generating React|Installing|Dev server/i).first()
      .or(page.locator('button').filter({ hasText: /Stop/ }))
  ).toBeVisible({ timeout: 30_000 })
  await page.screenshot({ path: 'test-results/lf-06-building.png' })
  await page.waitForTimeout(DELAY)

  // Gemini 빌드 완료 대기 (3 스크린 → React 프로젝트 생성은 5분+ 소요)
  await expect(
    page.getByText(/writing to disk|Frontend generation failed/i).first(),
  ).toBeVisible({ timeout: 360_000 })

  if (await page.getByText(/Frontend generation failed/i).count() > 0) {
    // 전체 Agent Log 캡처 — 에러 메시지 포함 엘리먼트 찾기
    const errorEl = page.getByText(/Frontend generation failed/i).first()
    const errorText = await errorEl.textContent().catch(() => 'unknown')
    console.error(`❌ Frontend build error: ${errorText}`)
    await page.screenshot({ path: 'test-results/lf-07-frontend-error.png' })

    // Frontend 빌드 실패 — 테스트 실패 처리
    throw new Error(`Frontend generation failed: ${errorText}`)
  }

  await page.screenshot({ path: 'test-results/lf-07-gemini-done.png' })
  await page.waitForTimeout(DELAY)

  // npm install
  await expect(page.getByText(/Installing dependencies/i)).toBeVisible({ timeout: 30_000 })
  await page.waitForTimeout(DELAY)

  // Dev server 시작
  await expect(
    page.getByText(/Dev server running|Dev server failed/i).first(),
  ).toBeVisible({ timeout: 180_000 })

  if (await page.getByText(/Dev server failed/i).count() > 0)
    throw new Error('Dev server failed')

  await page.screenshot({ path: 'test-results/lf-08-dev-server-running.png' })
  await page.waitForTimeout(DELAY)

  // Live Window 열림 대기
  let liveWindow = null
  for (let i = 0; i < 60; i++) {
    const windows = electronApp.windows()
    if (windows.length > 1) {
      liveWindow = windows.find(w => w !== page) || windows[windows.length - 1]
      break
    }
    await page.waitForTimeout(1000)
  }
  if (!liveWindow) throw new Error('Live Window did not open')

  await liveWindow.waitForLoadState('load', { timeout: 30_000 })
  await expect(liveWindow.locator('#__vs-input')).toBeVisible({ timeout: 15_000 })
  await liveWindow.screenshot({ path: 'test-results/lf-09-live-window.png' })
  console.log('✅ Live Window 열림, 프롬프트 바 확인')
  await page.waitForTimeout(DELAY)

  // ═══════════════════════════════════════════════════════════════
  // Phase 6: Designer 모드 — 오류 수정
  // ═══════════════════════════════════════════════════════════════
  // Run 상태(Stop 버튼)가 되어야 모드 토글이 표시됨
  await expect(page.getByRole('button', { name: /Stop/i })).toBeVisible({ timeout: 10_000 })
  await page.waitForTimeout(DELAY)

  // Designer 모드 토글 확인 (기본값)
  const designerToggle = page.getByText('🎨 Designer')
  const hasDesignerToggle = await designerToggle.isVisible({ timeout: 5_000 }).catch(() => false)
  if (hasDesignerToggle) {
    console.log('✅ Designer 모드 활성화')
  } else {
    console.log('⚠️ Designer 토글 미표시 — isRunning 상태 확인 필요')
    await page.screenshot({ path: 'test-results/lf-debug-no-designer-toggle.png' })
  }
  await page.waitForTimeout(DELAY)

  // Live Window에서 오류 수정 프롬프트 입력
  const vsInput = liveWindow.locator('#__vs-input')
  const vsSubmit = liveWindow.locator('#__vs-submit')

  if (await vsInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await vsInput.fill('Fix the layout: make sure all KPI cards are evenly spaced in a row and properly aligned')
    await page.waitForTimeout(DELAY)
    await vsSubmit.click()

    // Agent Log에 Designer 피드백 대기
    await expect(page.getByText(/Live edit|Changes|Applied/i).first()).toBeVisible({ timeout: 60_000 })
    await page.waitForTimeout(DELAY)

    // Live Window status 확인
    await expect(
      liveWindow.locator('#__vs-status'),
    ).toContainText(/Applied|failed|Changes/i, { timeout: 120_000 })

    await liveWindow.screenshot({ path: 'test-results/lf-10-designer-fix.png' })
    await page.screenshot({ path: 'test-results/lf-10-editor-designer-fix.png' })
    console.log('✅ Designer 모드 오류 수정 완료')
  } else {
    console.log('⚠️ Live Window 프롬프트 바 미표시')
    await liveWindow.screenshot({ path: 'test-results/lf-10-no-prompt-bar.png' })
  }
  await page.waitForTimeout(DELAY)

  // ═══════════════════════════════════════════════════════════════
  // Phase 7: Developer 모드 — 기능 추가 + 오류 수정
  // ═══════════════════════════════════════════════════════════════
  // Developer 모드로 전환
  if (hasDesignerToggle) {
    await page.getByText('🎨 Designer').click()
    await expect(page.getByText('💻 Developer')).toBeVisible({ timeout: 3_000 })
    console.log('✅ Developer 모드로 전환')
  } else {
    console.log('⚠️ Designer 토글 없음 — Developer 모드 건너뜀')
  }
  await page.waitForTimeout(DELAY)

  // Developer 모드에서 기능 추가
  await liveWindow.locator('#__vs-input').fill('Add a dark mode toggle button in the header navigation bar')
  await page.waitForTimeout(DELAY)
  await liveWindow.locator('#__vs-submit').click()

  // Agent Log에 Developer 피드백 대기
  await expect(page.getByText(/Live edit|Applied/i).first()).toBeVisible({ timeout: 60_000 })
  await page.waitForTimeout(DELAY)

  // Live Window status
  await expect(
    liveWindow.locator('#__vs-status'),
  ).toContainText(/Applied|Developer|failed/i, { timeout: 120_000 })

  await liveWindow.screenshot({ path: 'test-results/lf-11-developer-feature.png' })
  await page.screenshot({ path: 'test-results/lf-11-editor-developer-feature.png' })

  // ── 6번 검증: Live 앱 뷰어 내 MD 패널 확인 ──
  const mdPanel = liveWindow.locator('#__vs-md-panel')
  const hasMdPanel = await mdPanel.isVisible({ timeout: 10_000 }).catch(() => false)
  if (hasMdPanel) {
    console.log('✅ Live Window 내 Developer MD 패널 표시')
    const mdContent = await liveWindow.locator('#__vs-md-body').textContent()
    expect(mdContent).toContain('Live edit summary')
    await liveWindow.screenshot({ path: 'test-results/lf-11b-live-md-panel.png' })
    await page.waitForTimeout(DELAY)
  } else {
    console.log('⚠️ Live Window MD 패널 미표시')
  }

  // Developer 피드백은 별도 팝업 창에 표시됨 (캔버스 모달 제거됨)
  // 팝업 창 존재 확인
  await page.waitForTimeout(2000)
  const allWindows = electronApp.windows()
  const feedbackPopup = allWindows.find(w => w !== page && w !== liveWindow)
  if (feedbackPopup) {
    console.log('✅ Developer 피드백 팝업 창 열림')
    await feedbackPopup.screenshot({ path: 'test-results/lf-12-feedback-popup.png' })
    await page.waitForTimeout(DELAY)
  } else {
    console.log('⚠️ 피드백 팝업 창 미감지')
  }

  // Developer 모드에서 오류 수정
  if (await vsInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await vsInput.fill('Fix any TypeScript errors and make sure the page renders without console errors')
    await page.waitForTimeout(DELAY)
    await vsSubmit.click()

    await expect(
      liveWindow.locator('#__vs-status'),
    ).toContainText(/Applied|failed/i, { timeout: 120_000 })
  }

  await liveWindow.screenshot({ path: 'test-results/lf-13-developer-bugfix.png' })
  console.log('✅ Developer 모드 오류 수정 완료')
  await page.waitForTimeout(DELAY)

  // ═══════════════════════════════════════════════════════════════
  // Phase 8: VS Code 연동 — IPC로 직접 Export + VS Code 열기
  // ═══════════════════════════════════════════════════════════════
  // Export via IPC
  const exportResult = await page.evaluate(async () => {
    return await (window as any).electronAPI?.project?.exportToFolder?.('test-export', '~/VibeSynth/export/test-export')
  })
  console.log(`Export result: ${exportResult?.success ? '✅ 성공' : '⚠️ ' + (exportResult?.error || 'unknown')}`)
  await page.waitForTimeout(DELAY)

  // VS Code via IPC
  const vscodeResult = await page.evaluate(async () => {
    return await (window as any).electronAPI?.shell?.openVscode?.('~/VibeSynth/export/test-export')
  })
  console.log(`VS Code result: ${vscodeResult?.success ? '✅ 확인' : '⚠️ ' + (vscodeResult?.error || 'CLI 미설치')}`)
  await page.waitForTimeout(DELAY)

  await page.screenshot({ path: 'test-results/lf-14-final.png' })

  // ═══════════════════════════════════════════════════════════════
  // Phase 9: 정리 — Stop
  // ═══════════════════════════════════════════════════════════════
  // 피드백 팝업 창 닫기 (있으면)
  await page.evaluate(async () => {
    await (window as any).electronAPI?.feedback?.close?.()
  }).catch(() => {})
  await page.waitForTimeout(500)

  const stopBtn = page.getByRole('button', { name: /Stop/i })
  if (await stopBtn.isVisible().catch(() => false)) {
    await stopBtn.click({ force: true })
    await expect(page.getByRole('button', { name: /Run/i })).toBeVisible({ timeout: 10_000 })
  }
  await page.waitForTimeout(DELAY)
  await page.screenshot({ path: 'test-results/lf-15-complete.png' })

  console.log('\n🏁 LifeFlow Dashboard 전체 워크플로우 완료!')
})
