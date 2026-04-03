import { test, expect } from '@playwright/test'

/**
 * Visual screenshot tests for VibeSynth.
 * Captures screenshots of every major view/state for visual QA.
 *
 * Run: npx playwright test visual-check --project=vibesynth
 */
test.describe('VibeSynth Visual Check', () => {
  test('01 - Dashboard full page', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: 'screenshots/vs-01-dashboard.png', fullPage: true })

    const header = page.locator('header')
    await expect(header).toBeVisible()
    const headerBg = await header.evaluate(el => getComputedStyle(el).backgroundColor)
    console.log('Header background:', headerBg)

    const body = page.locator('body')
    const bodyBg = await body.evaluate(el => getComputedStyle(el).backgroundColor)
    const bodyFont = await body.evaluate(el => getComputedStyle(el).fontFamily)
    console.log('Body background:', bodyBg)
    console.log('Body font-family:', bodyFont)
  })

  test('02 - Dashboard dark mode', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const appearanceBtn = page.getByRole('button', { name: 'Appearance' })
    if (await appearanceBtn.isVisible()) {
      await appearanceBtn.click()
      const darkBtn = page.getByRole('button', { name: 'Dark', exact: true })
      if (await darkBtn.isVisible()) {
        await darkBtn.click()
        await page.waitForTimeout(300)
      }
    }
    await page.screenshot({ path: 'screenshots/vs-02-dashboard-dark.png', fullPage: true })
  })

  test('03 - Dashboard App/Web toggle', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: 'screenshots/vs-03-dashboard-app-mode.png' })

    await page.getByRole('button', { name: 'Web', exact: true }).click()
    await page.waitForTimeout(200)
    await page.screenshot({ path: 'screenshots/vs-04-dashboard-web-mode.png' })
  })

  test('04 - Dashboard model selector', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const fastBtn = page.getByRole('button', { name: 'Fast' })
    const flashBtn = page.getByRole('button', { name: '3.0 Flash' })
    const modelBtn = fastBtn.or(flashBtn)
    await modelBtn.first().click()
    await page.waitForTimeout(200)
    await page.screenshot({ path: 'screenshots/vs-05-model-selector.png' })
  })

  test('05 - Editor full page (example project)', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await page.getByRole('button', { name: /Indoor Plant Care/ }).click()
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'screenshots/vs-06-editor.png', fullPage: true })

    const canvas = page.locator('.flex-1.overflow-hidden').first()
    if (await canvas.isVisible()) {
      const bg = await canvas.evaluate(el => getComputedStyle(el).backgroundColor)
      console.log('Canvas background:', bg)
    }
  })

  test('06 - Editor design system panel', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /Indoor Plant Care/ }).click()
    await page.waitForTimeout(500)

    const panel = page.getByText('Color Palette').or(page.getByText('Generating design system...'))
    if (await panel.first().isVisible()) {
      await panel.first().locator('..').screenshot({ path: 'screenshots/vs-07-design-system-card.png' })
    }
  })

  test('07 - Editor right panel tabs', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /Indoor Plant Care/ }).click()
    await page.waitForTimeout(500)

    await page.getByRole('button', { name: 'Components' }).click()
    await page.waitForTimeout(200)
    await page.screenshot({ path: 'screenshots/vs-08-components-tab.png' })

    await page.getByRole('button', { name: 'Layers' }).click()
    await page.waitForTimeout(200)
    await page.screenshot({ path: 'screenshots/vs-09-layers-tab.png' })
  })

  test('08 - Editor hamburger menu', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /Indoor Plant Care/ }).click()
    await page.waitForTimeout(500)

    await page.locator('header button').first().click()
    await page.waitForTimeout(300)
    await page.screenshot({ path: 'screenshots/vs-11-hamburger-menu.png' })
  })

  test('09 - Editor prompt bar', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /Indoor Plant Care/ }).click()
    await page.waitForTimeout(500)

    const promptArea = page.locator('.max-w-2xl').last()
    if (await promptArea.isVisible()) {
      await promptArea.screenshot({ path: 'screenshots/vs-12-prompt-bar.png' })
    }
  })

  test('10 - Editor dark mode', async ({ page }) => {
    await page.goto('/')
    const appearanceBtn = page.getByRole('button', { name: 'Appearance' })
    if (await appearanceBtn.isVisible()) {
      await appearanceBtn.click()
      await page.getByRole('button', { name: 'Dark', exact: true }).click()
      await page.waitForTimeout(300)
    }

    await page.getByRole('button', { name: /Indoor Plant Care/ }).click()
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'screenshots/vs-13-editor-dark.png', fullPage: true })
  })

  test('11 - Settings page', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const settingsBtn = page.locator('button[title="Settings"]').first()
    if (await settingsBtn.isVisible()) {
      await settingsBtn.click()
      await page.waitForTimeout(500)
      await page.screenshot({ path: 'screenshots/vs-14-settings.png', fullPage: true })
    }
  })
})
