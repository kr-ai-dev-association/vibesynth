import { test, expect } from './electron-fixture'

test('3화면 프로젝트 생성 후 저장된 디자인 시스템 불러오기', async ({ electronApp, page }) => {
  test.setTimeout(600_000)

  // ═══════════════════════════════════════════════════════════════
  // Phase 1: 3화면 웹 프로젝트 생성
  // ═══════════════════════════════════════════════════════════════
  await expect(page.getByText('Welcome to VibeSynth.')).toBeVisible()
  await page.getByRole('button', { name: 'Web' }).click()

  const textarea = page.locator('textarea')
  await textarea.fill(
    'A modern task management web app with clean blue (#2563EB) and white design. ' +
    'Use Inter font, rounded cards with subtle shadows. ' +
    'screens: Dashboard – overview with task stats cards, recent activity feed, and a productivity chart; ' +
    'Task Board – kanban columns (To Do, In Progress, Done) with draggable task cards and priority badges; ' +
    'Team Members – grid of member profile cards with avatar, role, task count, and online status indicator'
  )
  await textarea.press('Enter')

  // Wait for 3 placeholder screens
  const screenCards = page.locator('[data-screen-card]')
  await expect(async () => {
    expect(await screenCards.count()).toBe(3)
  }).toPass({ timeout: 30_000 })
  console.log('Phase 1: 3 placeholder screens appeared')
  await page.screenshot({ path: 'test-results/lds-01-placeholders.png' })

  // Wait for all screens to finish generating
  await expect(async () => {
    const badges = await page.locator('text=GENERATING').count()
    expect(badges).toBe(0)
  }).toPass({ timeout: 300_000 })

  const count = await screenCards.count()
  expect(count).toBe(3)
  console.log(`Phase 1: All ${count} screens generated`)
  await page.screenshot({ path: 'test-results/lds-02-screens-generated.png' })

  // Capture original design system info
  const themeName = page.locator('[data-testid="theme-name"]')
  await expect(themeName).toBeVisible({ timeout: 10_000 })
  const originalTheme = await themeName.textContent()
  console.log(`Phase 1: Original theme = "${originalTheme}"`)

  // Capture original screen HTML snippet (first screen) for comparison
  const firstIframe = screenCards.first().locator('iframe')
  const originalHtml = await firstIframe.getAttribute('srcdoc') || ''
  console.log(`Phase 1: Original HTML length = ${originalHtml.length}`)

  // ═══════════════════════════════════════════════════════════════
  // Phase 2: 저장된 디자인 시스템 목록 확인 및 불러오기
  // ═══════════════════════════════════════════════════════════════
  // Ensure Design tab is active
  await page.locator('button', { hasText: 'Design' }).first().click()
  await page.waitForTimeout(500)

  const loadDropdown = page.locator('[data-testid="load-design-system"]')
  await expect(loadDropdown).toBeVisible({ timeout: 5_000 })

  // Check how many options are available
  const optionCount = await loadDropdown.locator('option').count()
  console.log(`Phase 2: ${optionCount - 1} saved design systems available`) // -1 for placeholder option
  expect(optionCount).toBeGreaterThan(1) // At least 1 saved system + placeholder
  await page.screenshot({ path: 'test-results/lds-03-load-dropdown.png' })

  // List all available design systems
  const options = await loadDropdown.locator('option').allTextContents()
  console.log(`Phase 2: Available systems: ${options.slice(1).join(', ')}`)

  // Pick a visually distinct one — try "Neon Cyberpunk" or the second option
  let targetOption = options.find(o => o.includes('Cyberpunk')) || options.find(o => o.includes('Pastel')) || options[1]
  if (!targetOption || targetOption === 'Load Saved...') targetOption = options[1]
  console.log(`Phase 2: Loading "${targetOption}"...`)

  // Select the design system
  await loadDropdown.selectOption({ label: targetOption })
  await page.waitForTimeout(1500)

  // Verify theme name changed
  const newTheme = await themeName.textContent()
  console.log(`Phase 2: Theme changed: "${originalTheme}" → "${newTheme}"`)
  expect(newTheme).not.toBe(originalTheme)
  await page.screenshot({ path: 'test-results/lds-04-after-load.png' })

  // ═══════════════════════════════════════════════════════════════
  // Phase 3: 스크린 HTML이 실제로 변경되었는지 검증
  // ═══════════════════════════════════════════════════════════════
  const newHtml = await firstIframe.getAttribute('srcdoc') || ''
  console.log(`Phase 3: New HTML length = ${newHtml.length}`)
  expect(newHtml).not.toBe(originalHtml)
  console.log('Phase 3: Screen HTML changed after loading design system ✓')

  // Verify agent log shows update message
  await expect(page.getByText(/Loaded design system/i).first()).toBeVisible({ timeout: 5_000 })
  const logMsg = await page.getByText(/Loaded design system/i).first().textContent()
  console.log(`Phase 3: ${logMsg}`)

  // Verify all 3 screens are still present
  expect(await screenCards.count()).toBe(3)
  console.log('Phase 3: All 3 screens still intact after design system change')

  // Take final screenshots of each screen
  for (let i = 0; i < 3; i++) {
    await page.screenshot({ path: `test-results/lds-05-screen-${i + 1}.png` })
  }

  // ═══════════════════════════════════════════════════════════════
  // Phase 4: 다른 디자인 시스템으로 한번 더 변경 테스트
  // ═══════════════════════════════════════════════════════════════
  const secondTarget = options.find(o => o.includes('EcoMarket')) || options.find(o => o.includes('Pastel')) || options[options.length - 1]
  if (secondTarget && secondTarget !== targetOption && secondTarget !== 'Load Saved...') {
    console.log(`Phase 4: Loading second system "${secondTarget}"...`)
    await loadDropdown.selectOption({ label: secondTarget })
    await page.waitForTimeout(1500)

    const thirdTheme = await themeName.textContent()
    console.log(`Phase 4: Theme changed: "${newTheme}" → "${thirdTheme}"`)
    expect(thirdTheme).not.toBe(newTheme)

    const thirdHtml = await firstIframe.getAttribute('srcdoc') || ''
    expect(thirdHtml).not.toBe(newHtml)
    console.log('Phase 4: Second design system swap verified ✓')
    await page.screenshot({ path: 'test-results/lds-06-second-swap.png' })
  }

  console.log('✓ Load design system test complete')
  await page.screenshot({ path: 'test-results/lds-07-final.png' })
})
