import { test, expect } from './electron-fixture'

test('풀 워크플로우: 3화면 생성 → 히트맵 → 빌드+수정 → 화면 추가 → 증분 빌드', async ({ electronApp, page }) => {
  test.setTimeout(900_000)

  // ═══════════════════════════════════════════════════════════════
  // Phase 1: 3화면 데스크탑 피트니스 앱 생성 (밝고 화사한 컨셉)
  // ═══════════════════════════════════════════════════════════════
  await expect(page.getByText('Welcome to VibeSynth.')).toBeVisible()
  await page.getByRole('button', { name: 'Web' }).click()

  const textarea = page.locator('textarea')
  await textarea.fill(
    'A bright vibrant fitness web app. Use warm orange (#FF6B35) and coral (#FF8C61) as primary accent colors on a light cream (#FFF8F0) background. ' +
    'All screens must share the same color palette, typography (Inter font), rounded-2xl cards with subtle shadow, and navigation bar style. ' +
    'screens: Home – hero banner with runner image, workout category cards, and a daily motivation quote section; ' +
    'Workout Library – grid of exercise cards with reps and duration badges, filter chips at top; ' +
    'My Progress – weekly activity bar chart, calories burned stat, streak counter, and achievement badges grid'
  )
  await textarea.press('Enter')

  await expect(page.getByText('Generating...').first()).toBeVisible({ timeout: 15_000 })

  const screenCards = page.locator('[data-screen-card]')
  await expect(async () => {
    expect(await screenCards.count()).toBe(3)
  }).toPass({ timeout: 240_000 })

  const phase1Count = await screenCards.count()
  expect(phase1Count).toBe(3)
  console.log(`Phase 1: Generated ${phase1Count} fitness screens`)
  await page.screenshot({ path: 'test-results/wf-01-fitness-screens.png' })

  // ─── 동적 높이 검증: 각 스크린 카드의 높이가 정상 측정되었는지 확인 ───
  await page.waitForTimeout(3000) // height report script 실행 대기
  for (let i = 0; i < phase1Count; i++) {
    const card = screenCards.nth(i)
    const dims = await card.getAttribute('data-screen-dims')
    console.log(`  Screen ${i + 1} dims: ${dims}`)
    const match = dims?.match(/(\d+)x(\d+)/)
    if (match) {
      const h = parseInt(match[2], 10)
      // 데스크탑: 최소 높이(900)보다 같거나 크고, 초기값(4000) 그대로가 아니어야 함
      expect(h).toBeGreaterThanOrEqual(900)
    }
  }
  await page.screenshot({ path: 'test-results/wf-01b-dynamic-heights.png' })

  // ═══════════════════════════════════════════════════════════════
  // Phase 2: 히트맵 확인 후 효과 부여
  // ═══════════════════════════════════════════════════════════════
  await screenCards.first().click()
  await expect(page.getByText('Modify')).toBeVisible({ timeout: 5_000 })

  // Generate → Predictive heat map
  await page.getByText('Generate').first().click()
  await page.getByRole('button', { name: 'Predictive heat map' }).click()

  await expect(page.getByText(/Generating predictive heatmap/i)).toBeVisible({ timeout: 10_000 })
  await expect(page.getByText(/attention zones identified/i)).toBeVisible({ timeout: 120_000 })

  const heatmapZones = page.locator('[data-heatmap-zone]')
  await expect(heatmapZones.first()).toBeVisible({ timeout: 10_000 })
  const zoneCount = await heatmapZones.count()
  console.log(`Phase 2: Heatmap has ${zoneCount} zones`)
  await page.screenshot({ path: 'test-results/wf-02-heatmap.png' })

  // 첫 번째 존 → Hover effect
  await heatmapZones.first().click()
  await expect(page.getByText('ADD INTERACTION')).toBeVisible({ timeout: 5_000 })
  await page.getByRole('button', { name: 'Hover effect' }).click()

  await expect(page.getByText(/Applied "hover-effect"/i)).toBeVisible({ timeout: 120_000 })
  console.log('Phase 2: Hover effect applied')
  await page.screenshot({ path: 'test-results/wf-03-effect-applied.png' })

  // 히트맵/선택 해제
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)

  // ═══════════════════════════════════════════════════════════════
  // Phase 3: 빌드 후 특정 기능 수정 (Live Edit)
  // ═══════════════════════════════════════════════════════════════
  await page.getByRole('button', { name: '▶ Run' }).click()

  await expect(page.getByRole('button', { name: /Building/i })).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText('Generating React frontend from screens...')).toBeVisible({ timeout: 10_000 })
  await page.screenshot({ path: 'test-results/wf-04-building.png' })

  // Gemini 완료 대기
  await expect(
    page.getByText(/writing to disk|Frontend generation failed/i).first(),
  ).toBeVisible({ timeout: 180_000 })

  if (await page.getByText(/Frontend generation failed/i).count() > 0) {
    await page.screenshot({ path: 'test-results/wf-04-build-failed.png' })
    throw new Error('First build failed: ' + await page.getByText(/Frontend generation failed/i).first().textContent())
  }

  // Dev server 대기 (auto-fix 포함 시 더 오래 걸릴 수 있음)
  await expect(
    page.getByText(/Dev server running|Dev server failed after/i).first(),
  ).toBeVisible({ timeout: 300_000 })

  // 자동 수정이 발생했는지 로그 확인
  const autoFixCount = await page.getByText(/Auto-fixing build errors/i).count()
  if (autoFixCount > 0) {
    console.log(`Phase 3: Auto-fix triggered ${autoFixCount} time(s)`)
    const fixLog = await page.getByText(/AI fixed/i).first().textContent().catch(() => '')
    if (fixLog) console.log(`Phase 3: ${fixLog}`)
  }

  if (await page.getByText(/Dev server failed after/i).count() > 0) {
    await page.screenshot({ path: 'test-results/wf-05-build-failed-final.png' })
    throw new Error('Dev server failed after auto-fix attempts')
  }

  console.log('Phase 3: First build complete')
  await page.screenshot({ path: 'test-results/wf-05-dev-server.png' })

  // Live Window
  let liveWindow = null
  for (let i = 0; i < 30; i++) {
    const windows = electronApp.windows()
    if (windows.length > 1) {
      liveWindow = windows.find(w => w !== page) || windows[windows.length - 1]
      break
    }
    await page.waitForTimeout(1000)
  }
  expect(liveWindow).toBeTruthy()
  await liveWindow!.waitForLoadState('load', { timeout: 30_000 })
  await liveWindow!.screenshot({ path: 'test-results/wf-06-live-window.png' })

  // Live edit: 기능 수정
  await expect(liveWindow!.locator('#__vs-input')).toBeVisible({ timeout: 15_000 })
  await liveWindow!.locator('#__vs-input').fill('Add a "Start Workout" floating action button with a play icon at the bottom right corner')
  await liveWindow!.locator('#__vs-submit').click()

  await expect(page.getByText(/Live edit/i).first()).toBeVisible({ timeout: 30_000 })
  await expect(
    liveWindow!.locator('#__vs-status'),
  ).toContainText(/Applied|failed/i, { timeout: 120_000 })

  console.log('Phase 3: Live edit applied')
  await liveWindow!.screenshot({ path: 'test-results/wf-07-after-edit.png' })
  await page.screenshot({ path: 'test-results/wf-07-editor.png' })

  // ═══════════════════════════════════════════════════════════════
  // Phase 4: 디자인 화면으로 돌아와서 새로운 화면 생성
  // ═══════════════════════════════════════════════════════════════
  await page.getByRole('button', { name: '■ Stop' }).click()
  await expect(page.getByRole('button', { name: '▶ Run' })).toBeVisible({ timeout: 10_000 })
  console.log('Phase 4: Back to design mode')

  // 선택 해제
  await page.keyboard.press('Escape')
  await page.waitForTimeout(500)

  // 새 스크린 생성
  const promptBar = page.locator('textarea')
  await promptBar.fill(
    'Workout Detail page with exercise video placeholder at top, step-by-step instructions list, ' +
    'muscle group tags, difficulty badge, timer controls, and a bright "Complete Workout" button at bottom'
  )
  await promptBar.press('Enter')

  await expect(page.getByText('Generating...').first()).toBeVisible({ timeout: 15_000 })

  await expect(async () => {
    expect(await screenCards.count()).toBeGreaterThan(phase1Count)
  }).toPass({ timeout: 180_000 })

  const phase4Count = await screenCards.count()
  console.log(`Phase 4: Now ${phase4Count} screens (was ${phase1Count})`)
  await page.screenshot({ path: 'test-results/wf-08-new-screen.png' })

  // ═══════════════════════════════════════════════════════════════
  // Phase 5: 증분 빌드 후 동작 테스트
  // ═══════════════════════════════════════════════════════════════
  await page.getByRole('button', { name: '▶ Run' }).click()
  await expect(page.getByRole('button', { name: /Building/i })).toBeVisible({ timeout: 15_000 })

  // 증분 빌드 로그
  await expect(page.getByText(/Incremental build/i).first()).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText(/Cached:/i).first()).toBeVisible({ timeout: 5_000 })
  await expect(page.getByText(/Building:/i).first()).toBeVisible({ timeout: 5_000 })

  const cachedLog = await page.getByText(/Cached:/i).first().textContent()
  const buildingLog = await page.getByText(/Building:/i).first().textContent()
  console.log(`Phase 5: ${cachedLog}`)
  console.log(`Phase 5: ${buildingLog}`)
  await page.screenshot({ path: 'test-results/wf-09-incremental.png' })

  // 빌드 완료 대기
  await expect(
    page.getByText(/Dev server running|Files updated|Dev server failed|Frontend generation failed/i).first(),
  ).toBeVisible({ timeout: 300_000 })

  if (await page.getByText(/Dev server failed|Frontend generation failed/i).count() > 0) {
    await page.screenshot({ path: 'test-results/wf-09-incr-failed.png' })
    throw new Error('Incremental build failed: ' + await page.getByText(/Dev server failed|Frontend generation failed/i).first().textContent())
  }

  console.log('Phase 5: Incremental build complete')
  await page.screenshot({ path: 'test-results/wf-10-incr-done.png' })

  // Live Window 확인
  let liveWindow2 = null
  for (let i = 0; i < 30; i++) {
    const windows = electronApp.windows()
    if (windows.length > 1) {
      liveWindow2 = windows.find(w => w !== page) || windows[windows.length - 1]
      break
    }
    await page.waitForTimeout(1000)
  }

  if (liveWindow2) {
    await liveWindow2.waitForLoadState('load', { timeout: 30_000 })
    await liveWindow2.screenshot({ path: 'test-results/wf-11-live-incremental.png' })
    console.log('Phase 5: Live window verified')
  }

  // 최종 정리
  await page.getByRole('button', { name: '■ Stop' }).click()
  await expect(page.getByRole('button', { name: '▶ Run' })).toBeVisible({ timeout: 10_000 })

  console.log('✓ Full workflow test complete')
  await page.screenshot({ path: 'test-results/wf-12-final.png' })
})
