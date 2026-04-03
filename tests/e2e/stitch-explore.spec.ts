import { test } from '@playwright/test'

/**
 * Interactive Stitch exploration.
 * Opens browser, pauses for manual Google login, then captures all UI states.
 *
 * Run: PWDEBUG=1 npx playwright test stitch-explore --project=stitch --headed
 *  or: npx playwright test stitch-explore --project=stitch --headed --debug
 */

test.setTimeout(600_000)

test('Stitch full exploration (manual login)', async ({ page, context }) => {
  // Navigate to Stitch landing and click "Try now" to initiate login
  await page.goto('https://stitch.withgoogle.com')
  await page.waitForTimeout(3000)

  // PAUSE here — user logs in manually via the Playwright Inspector
  // In the Inspector, click ▶ (Resume) when done logging in and seeing the dashboard.
  await page.pause()

  // After resume — we should be on the dashboard
  await page.waitForTimeout(2000)
  console.log('✅ Resumed! Current URL:', page.url())

  // ─── DASHBOARD ───
  await page.screenshot({ path: 'screenshots/stitch-01-dashboard.png', fullPage: true })
  console.log('📸 stitch-01-dashboard.png')

  const dashText = await page.evaluate(() => document.body.innerText)
  console.log('=== DASHBOARD TEXT ===')
  console.log(dashText.slice(0, 4000))

  // Buttons
  const btns = await page.locator('button').all()
  console.log(`=== BUTTONS (${btns.length}) ===`)
  for (const b of btns.slice(0, 60)) {
    const t = (await b.textContent())?.trim()
    const a = await b.getAttribute('aria-label')
    const label = t || a
    if (label && label.length > 0 && label.length < 150) console.log(`  btn: "${label}"`)
  }

  // App/Web toggle
  const webBtn = page.locator('button').filter({ hasText: /^Web$/ }).first()
  if (await webBtn.isVisible().catch(() => false)) {
    await webBtn.click()
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'screenshots/stitch-02-web-mode.png' })
    console.log('📸 stitch-02-web-mode.png')
    const appBtn = page.locator('button').filter({ hasText: /^App$/ }).first()
    if (await appBtn.isVisible().catch(() => false)) await appBtn.click()
    await page.waitForTimeout(300)
  }

  // Model selector
  const modelBtn = page.locator('button').filter({ hasText: /Flash|Quality|Redesign|Ideate/ }).first()
  if (await modelBtn.isVisible().catch(() => false)) {
    await modelBtn.click()
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'screenshots/stitch-03-model-selector.png' })
    console.log('📸 stitch-03-model-selector.png')
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
  }

  // Appearance
  const appToggle = page.locator('button[aria-label*="ppearance"], button[title*="ppearance"]').first()
  const appToggle2 = page.locator('button').filter({ hasText: /Appearance/ }).first()
  const at = (await appToggle.isVisible().catch(() => false)) ? appToggle : appToggle2
  if (await at.isVisible().catch(() => false)) {
    await at.click()
    await page.waitForTimeout(300)
    await page.screenshot({ path: 'screenshots/stitch-04-appearance.png' })
    console.log('📸 stitch-04-appearance.png')
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
  }

  // Settings
  const settingsBtn = page.locator('button[aria-label*="etting"], button[title*="etting"]').first()
  if (await settingsBtn.isVisible().catch(() => false)) {
    await settingsBtn.click()
    await page.waitForTimeout(1000)
    await page.screenshot({ path: 'screenshots/stitch-04b-settings.png', fullPage: true })
    console.log('📸 stitch-04b-settings.png')
    await page.goBack()
    await page.waitForTimeout(2000)
  }

  // ─── OPEN EXAMPLE PROJECT → EDITOR ───
  // Pause again so user can click an example project
  console.log('⏸ Pausing — please click an example project to open the editor, then Resume.')
  await page.pause()

  await page.waitForTimeout(2000)
  console.log('✅ Resumed in editor! URL:', page.url())

  await page.screenshot({ path: 'screenshots/stitch-05-editor.png', fullPage: true })
  console.log('📸 stitch-05-editor.png')

  const editorText = await page.evaluate(() => document.body.innerText)
  console.log('=== EDITOR TEXT ===')
  console.log(editorText.slice(0, 4000))

  // Editor buttons
  const edBtns = await page.locator('button').all()
  console.log(`=== EDITOR BUTTONS (${edBtns.length}) ===`)
  for (const b of edBtns.slice(0, 80)) {
    const t = (await b.textContent())?.trim()
    const a = await b.getAttribute('aria-label')
    const title = await b.getAttribute('title')
    const label = t || a || title
    if (label && label.length > 0 && label.length < 150) console.log(`  btn: "${label}"`)
  }

  // ─── SCREEN SELECTION ───
  console.log('⏸ Pausing — please click a screen card to select it, then Resume.')
  await page.pause()

  await page.waitForTimeout(1000)
  await page.screenshot({ path: 'screenshots/stitch-06-screen-selected.png', fullPage: true })
  console.log('📸 stitch-06-screen-selected.png')

  // Context toolbar menus
  const genBtn = page.locator('button').filter({ hasText: /^Generate/ }).first()
  if (await genBtn.isVisible().catch(() => false)) {
    console.log('✅ Context toolbar visible')
    await genBtn.click()
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'screenshots/stitch-07-generate-menu.png' })
    console.log('📸 stitch-07-generate-menu.png')
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)

    const modBtn = page.locator('button').filter({ hasText: /^Modify/ }).first()
    if (await modBtn.isVisible().catch(() => false)) {
      await modBtn.click()
      await page.waitForTimeout(500)
      await page.screenshot({ path: 'screenshots/stitch-08-modify-menu.png' })
      console.log('📸 stitch-08-modify-menu.png')
      await page.keyboard.press('Escape')
      await page.waitForTimeout(300)
    }

    const prevBtn = page.locator('button').filter({ hasText: /^Preview|^More/ }).first()
    if (await prevBtn.isVisible().catch(() => false)) {
      await prevBtn.click()
      await page.waitForTimeout(500)
      await page.screenshot({ path: 'screenshots/stitch-09-preview-menu.png' })
      console.log('📸 stitch-09-preview-menu.png')
      await page.keyboard.press('Escape')
      await page.waitForTimeout(300)
    }

    const moreBtn = page.locator('button').filter({ hasText: /^More/ }).first()
    if (await moreBtn.isVisible().catch(() => false)) {
      await moreBtn.click()
      await page.waitForTimeout(500)
      await page.screenshot({ path: 'screenshots/stitch-10-more-menu.png' })
      console.log('📸 stitch-10-more-menu.png')
      await page.keyboard.press('Escape')
      await page.waitForTimeout(300)
    }
  }

  // Right-click context menu
  console.log('⏸ Pausing — please right-click a screen card, then Resume.')
  await page.pause()

  await page.waitForTimeout(500)
  await page.screenshot({ path: 'screenshots/stitch-11-context-menu.png' })
  console.log('📸 stitch-11-context-menu.png')
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)

  // Hamburger menu
  const hamburger = page.locator('button').first()
  if (await hamburger.isVisible().catch(() => false)) {
    await hamburger.click()
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'screenshots/stitch-12-hamburger.png' })
    console.log('📸 stitch-12-hamburger.png')
    await page.keyboard.press('Escape')
  }

  // Agent log
  const agentBtn = page.locator('button').filter({ hasText: /Agent/i }).first()
  if (await agentBtn.isVisible().catch(() => false)) {
    await agentBtn.click()
    await page.waitForTimeout(300)
    await page.screenshot({ path: 'screenshots/stitch-13-agent-log.png' })
    console.log('📸 stitch-13-agent-log.png')
  }

  // Final full screenshot
  await page.screenshot({ path: 'screenshots/stitch-14-final.png', fullPage: true })
  console.log('📸 stitch-14-final.png')

  console.log('\n🏁 Stitch exploration complete! Check screenshots/ folder.')
})
