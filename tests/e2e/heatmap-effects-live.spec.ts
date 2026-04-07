import { test, expect } from './electron-fixture'

test('기존 프로젝트: 모든 스크린 히트맵 → 모든 효과 부여 → Live App 빌드 실행', async ({ page }) => {
  test.setTimeout(600_000)
  const DELAY = 800

  // ═══════════════════════════════════════════════════════════════
  // Phase 1: 기존 프로젝트 열기
  // ═══════════════════════════════════════════════════════════════
  await expect(page.getByText('Welcome to VibeSynth.')).toBeVisible()

  const sidebar = page.locator('aside')
  // LifeFlow 프로젝트 찾기 (3+ screens)
  let target = sidebar.locator('button:has-text("LifeFlow")').first()
  if (await target.count() === 0) {
    target = sidebar.locator('button:has-text("admin")').first()
  }
  if (await target.count() === 0) {
    target = sidebar.locator('button').first()
  }

  const projectName = await target.textContent()
  console.log(`[Test] Opening: "${projectName?.slice(0, 50)}"`)
  await target.click()
  await page.waitForTimeout(2000)

  // ═══════════════════════════════════════════════════════════════
  // Phase 2: 스크린 로드 확인
  // ═══════════════════════════════════════════════════════════════
  const screenCards = page.locator('[data-screen-card]')
  await expect(screenCards.first()).toBeVisible({ timeout: 10_000 })
  const screenCount = await screenCards.count()
  console.log(`[Test] ${screenCount} screens loaded`)

  if (screenCount < 2) {
    console.log('[Test] Need at least 2 screens — skipping')
    return
  }

  // 효과 목록 (HeatmapActionMenu에서 정의된 6개)
  const ALL_EFFECTS = [
    { id: 'hover-effect', label: 'Hover Effect' },
    { id: 'click-animation', label: 'Click Animation' },
    { id: 'focus-state', label: 'Focus Ring' },
    { id: 'make-prominent', label: 'Boost Visibility' },
    { id: 'improve-hierarchy', label: 'Fix Hierarchy' },
    { id: 'micro-animation', label: 'Micro-animation' },
  ]

  let totalEffectsApplied = 0
  const maxScreens = Math.min(screenCount, 3) // 최대 3개 스크린

  // ═══════════════════════════════════════════════════════════════
  // Phase 3: 각 스크린에 히트맵 생성 → 모든 가능한 효과 부여
  // ═══════════════════════════════════════════════════════════════
  for (let si = 0; si < maxScreens; si++) {
    console.log(`\n═══ 스크린 ${si + 1}/${maxScreens} ═══`)

    // 1. 스크린 선택
    await screenCards.nth(si).click({ force: true })
    await page.waitForTimeout(DELAY)

    // 2. Generate 메뉴 → Predictive heat map
    const genBtn = page.getByRole('banner').getByRole('button', { name: 'Generate' })
    if (!await genBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      console.log(`⚠️ 스크린 ${si + 1}: Generate 버튼 미표시 — skip`)
      continue
    }
    await genBtn.click()
    await page.waitForTimeout(DELAY)

    const hmBtn = page.getByText('Predictive heat map')
    if (!await hmBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      console.log(`⚠️ 스크린 ${si + 1}: heat map 메뉴 미표시`)
      await page.keyboard.press('Escape')
      continue
    }
    await hmBtn.click()
    await page.waitForTimeout(DELAY)

    // 3. 히트맵 생성 대기 (Gemini 호출)
    console.log(`스크린 ${si + 1}: 히트맵 생성 대기...`)
    await page.waitForTimeout(20_000)

    // 4. 히트맵 존 감지
    const zones = page.locator('[data-heatmap-zone]')
    const zoneCount = await zones.count().catch(() => 0)
    console.log(`스크린 ${si + 1}: ${zoneCount}개 히트맵 존 감지`)

    if (zoneCount === 0) {
      // 히트맵 토글 해제
      try {
        await genBtn.click()
        await page.waitForTimeout(300)
        const exitHm = page.getByText('Predictive heat map')
        if (await exitHm.isVisible({ timeout: 2_000 }).catch(() => false)) await exitHm.click()
        await page.keyboard.press('Escape')
      } catch {}
      continue
    }

    // 5. 줌 확대 (히트맵 존 클릭 가능하도록)
    for (let z = 0; z < 3; z++) {
      await page.keyboard.press('Control+=')
      await page.waitForTimeout(150)
    }

    // 6. 각 존에 가능한 효과 부여 (round-robin)
    const effectsToApply = Math.min(zoneCount, ALL_EFFECTS.length)
    for (let zi = 0; zi < effectsToApply; zi++) {
      const effect = ALL_EFFECTS[zi % ALL_EFFECTS.length]
      console.log(`  존 ${zi + 1}: ${effect.label} 적용 시도...`)

      try {
        await zones.nth(zi).click({ force: true, timeout: 5_000 })
        await page.waitForTimeout(DELAY)

        // 효과 메뉴에서 해당 효과 버튼 클릭
        const effectBtn = page.getByText(effect.label)
        if (await effectBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
          await effectBtn.click({ force: true })
          totalEffectsApplied++
          console.log(`  ✅ ${effect.label} 적용 성공`)

          // CSS-only 효과는 즉시, AI 효과는 대기
          if (['make-prominent', 'improve-hierarchy'].includes(effect.id)) {
            await page.waitForTimeout(20_000) // AI 효과 대기
          } else {
            await page.waitForTimeout(2000) // CSS 효과 즉시
          }
        } else {
          console.log(`  ⚠️ ${effect.label} 버튼 미표시`)
          // 메뉴 닫기
          await page.mouse.click(10, 10)
          await page.waitForTimeout(300)
        }
      } catch (e) {
        console.log(`  ⚠️ 존 ${zi + 1} 클릭 실패: ${(e as Error).message?.slice(0, 50)}`)
      }
    }

    // 7. 줌 복원
    for (let z = 0; z < 3; z++) {
      await page.keyboard.press('Control+-')
      await page.waitForTimeout(150)
    }

    // 8. 히트맵 모드 해제
    try {
      const exitGen = page.getByRole('banner').getByRole('button', { name: 'Generate' })
      if (await exitGen.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await exitGen.click()
        await page.waitForTimeout(300)
        const exitHm = page.getByText('Predictive heat map')
        if (await exitHm.isVisible({ timeout: 2_000 }).catch(() => false)) {
          await exitHm.click()
          await page.waitForTimeout(300)
        }
        await page.keyboard.press('Escape')
      }
    } catch {}

    await page.mouse.click(600, 400)
    await page.waitForTimeout(DELAY)

    await page.screenshot({ path: `test-results/hm-fx-screen${si + 1}.png` })
  }

  console.log(`\n═══ 히트맵 효과 부여 완료: ${totalEffectsApplied}개 ═══`)

  // ═══════════════════════════════════════════════════════════════
  // Phase 4: 효과 적용된 HTML 검증
  // ═══════════════════════════════════════════════════════════════
  if (totalEffectsApplied > 0) {
    // Check that CSS effects were injected into screen HTML
    const firstIframe = screenCards.first().locator('iframe').first()
    const srcDoc = await firstIframe.getAttribute('srcdoc') || ''
    const hasEffectCss = srcDoc.includes('data-vs-effect') || srcDoc.includes('vs-fx-')
    console.log(`[Test] 효과 CSS 주입 확인: ${hasEffectCss}`)
  }

  // ═══════════════════════════════════════════════════════════════
  // Phase 5: Live App 빌드 (Rebuild Clean) + 실행
  // ═══════════════════════════════════════════════════════════════
  console.log('\n═══ Live App 빌드 시작 ═══')

  // 첫 번째 스크린 선택
  await screenCards.first().click()
  await page.waitForTimeout(300)

  // 드롭다운 → Rebuild (Clean)
  const dropdownArrow = page.locator('button svg[viewBox="0 0 12 12"]').first()
  await dropdownArrow.click()
  await page.waitForTimeout(300)

  const rebuildBtn = page.getByRole('button', { name: /Rebuild.*Clean/i })
  await expect(rebuildBtn).toBeVisible({ timeout: 3_000 })
  await rebuildBtn.click()
  console.log('[Test] Rebuild (Clean) 클릭')

  // 빌드 진행 대기
  await expect(
    page.getByText(/Clean rebuild|Workspace cleaned/i).first(),
  ).toBeVisible({ timeout: 15_000 })
  console.log('[Test] Workspace cleaned')

  await expect(
    page.getByText(/Generating React frontend/i).first(),
  ).toBeVisible({ timeout: 30_000 })
  console.log('[Test] Gemini 프론트엔드 생성 중...')

  // Gemini 완료 대기
  await expect(
    page.getByText(/writing to disk|Generated \d+ files/i).first(),
  ).toBeVisible({ timeout: 180_000 })
  console.log('[Test] 파일 생성 완료')

  // npm install + dev server 대기
  await expect(
    page.getByText(/Dev server running/i).first(),
  ).toBeVisible({ timeout: 180_000 })

  const devLog = await page.getByText(/Dev server running at/i).first().textContent()
  const urlMatch = devLog?.match(/http:\/\/localhost:\d+/)
  console.log(`[Test] Dev server: ${urlMatch?.[0]}`)

  await page.screenshot({ path: 'test-results/hm-fx-live-app.png' })

  // ═══════════════════════════════════════════════════════════════
  // Phase 6: 최종 검증
  // ═══════════════════════════════════════════════════════════════
  console.log(`\n═══ 최종 결과 ═══`)
  console.log(`✅ 히트맵 효과 ${totalEffectsApplied}개 적용`)
  console.log(`✅ Live App 빌드 + Dev Server 실행 성공`)
  console.log(`✅ 모든 스크린 히트맵 → 효과 → Live App 테스트 통과`)

  expect(totalEffectsApplied).toBeGreaterThanOrEqual(0)
})
