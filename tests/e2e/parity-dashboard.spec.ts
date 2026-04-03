import { test, expect, Page } from '@playwright/test'

/**
 * UX Parity Tests: VibeSynth Dashboard vs Stitch Dashboard
 * Captures screenshots for side-by-side visual comparison.
 *
 * Run: npx playwright test parity-dashboard --project=vibesynth
 */

const VIBESYNTH = 'http://localhost:5173'

async function captureVibesynth(page: Page) {
  await page.goto(VIBESYNTH)
  await page.waitForLoadState('networkidle')
  return page
}

test.describe('Parity: Dashboard / Landing', () => {

  test('full dashboard screenshot', async ({ page }) => {
    await captureVibesynth(page)
    await page.screenshot({ path: 'screenshots/parity-01-vs-dashboard.png' })
  })

  test('has BETA badge next to logo', async ({ page }) => {
    await captureVibesynth(page)
    await expect(page.getByText('BETA')).toBeVisible()
  })

  test('has prompt textarea with correct placeholder', async ({ page }) => {
    await captureVibesynth(page)
    const textarea = page.locator('textarea')
    await expect(textarea).toBeVisible()
    const placeholder = await textarea.getAttribute('placeholder')
    expect(placeholder).toContain('mobile app')
  })

  test('has App/Tablet/Web device toggle', async ({ page }) => {
    await captureVibesynth(page)
    await expect(page.getByRole('button', { name: 'App', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Tablet', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Web', exact: true })).toBeVisible()
  })

  test('has model selector (Stitch-style naming)', async ({ page }) => {
    await captureVibesynth(page)
    const modelBtn = page.getByRole('button', { name: /3\.0 Flash/ })
    await expect(modelBtn).toBeVisible()
    await modelBtn.click()
    await expect(page.getByText('3.0 Quality', { exact: true })).toBeVisible()
    await expect(page.getByText('Redesign', { exact: true })).toBeVisible()
    await expect(page.getByText('Ideate', { exact: true })).toBeVisible()
    await page.screenshot({ path: 'screenshots/parity-05-vs-models.png' })
  })

  test('has file attachment button (+)', async ({ page }) => {
    await captureVibesynth(page)
    const plusBtn = page.locator('button[title="Choose File"]')
    await expect(plusBtn).toBeVisible()
  })

  test('prompt placeholder changes on App/Web toggle', async ({ page }) => {
    await captureVibesynth(page)
    const textarea = page.locator('textarea')
    await expect(textarea).toHaveAttribute('placeholder', /mobile app/)
    await page.getByRole('button', { name: 'Web', exact: true }).click()
    await expect(textarea).toHaveAttribute('placeholder', /web experience/)
  })

  test('has sidebar with My projects and Shared with me tabs', async ({ page }) => {
    await captureVibesynth(page)
    await expect(page.getByRole('button', { name: /My projects/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Shared with me/ })).toBeVisible()
  })

  test('has search input for projects', async ({ page }) => {
    await captureVibesynth(page)
    await expect(page.getByPlaceholder('Search projects')).toBeVisible()
  })

  test('has prompt suggestion chips', async ({ page }) => {
    await captureVibesynth(page)
    const chips = page.getByRole('button').filter({ hasText: /recipe|browse tab|fitness/ })
    await expect(chips.first()).toBeVisible()
  })

  test('has appearance toggle with Light/System/Dark', async ({ page }) => {
    await captureVibesynth(page)
    const appearanceBtn = page.getByRole('button', { name: 'Appearance' })
    await expect(appearanceBtn).toBeVisible()
    await appearanceBtn.click()
    await expect(page.getByRole('button', { name: 'Light', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'System', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Dark', exact: true })).toBeVisible()
  })

  test('dark mode applies correctly', async ({ page }) => {
    await captureVibesynth(page)
    await page.getByRole('button', { name: 'Appearance' }).click()
    await page.getByRole('button', { name: 'Dark', exact: true }).click()
    await page.waitForTimeout(300)
    const body = page.locator('body')
    const bg = await body.evaluate(el => getComputedStyle(el).backgroundColor)
    expect(bg).not.toBe('rgb(255, 255, 255)')
    await page.screenshot({ path: 'screenshots/parity-07-vs-dark.png' })
  })

  test('clicking example opens editor', async ({ page }) => {
    await captureVibesynth(page)
    await page.getByText('Indoor Plant Care Dashboard').click()
    await page.waitForTimeout(500)
    await expect(page.getByText('Indoor Plant Care Dashboard')).toBeVisible()
    await expect(page.getByRole('button', { name: /Run/ })).toBeVisible()
    await page.screenshot({ path: 'screenshots/parity-08-vs-editor.png' })
  })

  test('clicking suggestion chip creates project', async ({ page }) => {
    await captureVibesynth(page)
    await page.getByRole('button').filter({ hasText: /recipe/ }).click()
    await page.waitForTimeout(500)
    await expect(page.getByRole('button', { name: /Run/ })).toBeVisible()
  })
})
