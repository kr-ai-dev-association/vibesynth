import { test, expect } from '@playwright/test'

test.describe('Dashboard header icons', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('Appearance toggle opens dropdown downward and shows options', async ({ page }) => {
    const btn = page.getByRole('button', { name: 'Appearance' })
    await expect(btn).toBeVisible()
    await btn.click()

    const lightBtn = page.getByRole('button', { name: 'Light', exact: true })
    const systemBtn = page.getByRole('button', { name: 'System', exact: true })
    const darkBtn = page.getByRole('button', { name: 'Dark', exact: true })
    await expect(lightBtn).toBeVisible()
    await expect(systemBtn).toBeVisible()
    await expect(darkBtn).toBeVisible()

    // Dropdown should be below the header (not clipped off-screen)
    const btnBox = await btn.boundingBox()
    const darkBox = await darkBtn.boundingBox()
    expect(btnBox).not.toBeNull()
    expect(darkBox).not.toBeNull()
    // Dropdown items should be below the button
    expect(darkBox!.y).toBeGreaterThan(btnBox!.y)
  })

  test('Appearance toggle: clicking Dark applies dark mode', async ({ page }) => {
    await page.getByRole('button', { name: 'Appearance' }).click()
    await page.getByRole('button', { name: 'Dark', exact: true }).click()

    const isDark = await page.locator('html').evaluate(el => el.classList.contains('dark'))
    expect(isDark).toBe(true)
  })

  test('Appearance toggle: clicking Light applies light mode', async ({ page }) => {
    // First set dark
    await page.getByRole('button', { name: 'Appearance' }).click()
    await page.getByRole('button', { name: 'Dark', exact: true }).click()

    // Then set light
    await page.getByRole('button', { name: 'Appearance' }).click()
    await page.getByRole('button', { name: 'Light', exact: true }).click()

    const isDark = await page.locator('html').evaluate(el => el.classList.contains('dark'))
    expect(isDark).toBe(false)
  })

  test('Settings icon navigates to settings page', async ({ page }) => {
    await page.getByRole('button', { name: 'Settings' }).click()
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
    await expect(page.getByText('General')).toBeVisible()
    await expect(page.getByText('API Key', { exact: true })).toBeVisible()
  })

  test('More (⋮) icon opens dropdown with menu items', async ({ page }) => {
    await page.getByRole('button', { name: 'More' }).click()
    await expect(page.getByText('Help & feedback')).toBeVisible()
    await expect(page.getByText('Keyboard shortcuts')).toBeVisible()
    await expect(page.getByText('About VibeSynth')).toBeVisible()
  })

  test('More menu closes when clicking outside', async ({ page }) => {
    await page.getByRole('button', { name: 'More' }).click()
    await expect(page.getByText('Help & feedback')).toBeVisible()

    // Click outside the menu
    await page.locator('main').click()
    await expect(page.getByText('Help & feedback')).not.toBeVisible()
  })
})

test.describe('Editor header icons', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.getByText('Indoor Plant Care Dashboard').click()
    await page.waitForTimeout(300)
  })

  test('Run button is visible and clickable', async ({ page }) => {
    const runBtn = page.getByRole('button', { name: /Run/ })
    await expect(runBtn).toBeVisible()
    await expect(runBtn).toContainText('Run')
  })

  test('Appearance toggle in editor opens dropdown downward', async ({ page }) => {
    const btn = page.getByRole('button', { name: 'Appearance' })
    await expect(btn).toBeVisible()
    await btn.click()

    await expect(page.getByRole('button', { name: 'Light', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Dark', exact: true })).toBeVisible()

    // Verify dropdown position is below the button
    const btnBox = await btn.boundingBox()
    const lightBox = await page.getByRole('button', { name: 'Light', exact: true }).boundingBox()
    expect(lightBox!.y).toBeGreaterThan(btnBox!.y)
  })

  test('Editor Settings icon navigates to settings page', async ({ page }) => {
    await page.getByRole('banner').getByRole('button', { name: 'Settings' }).click()
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
  })

  test('Hamburger menu opens with correct items', async ({ page }) => {
    await page.locator('button').filter({ has: page.locator('svg path[d="M3 12h18M3 6h18M3 18h18"]') }).click()
    await expect(page.getByText('Go to all projects')).toBeVisible()
    await expect(page.getByText('Appearance')).toBeVisible()
    await expect(page.getByText('Settings')).toBeVisible()
    await expect(page.getByText('Command menu')).toBeVisible()
  })

  test('Hamburger > Go to all projects returns to dashboard', async ({ page }) => {
    await page.locator('button').filter({ has: page.locator('svg path[d="M3 12h18M3 6h18M3 18h18"]') }).click()
    await page.getByText('Go to all projects').click()
    await expect(page.getByRole('heading', { name: /Welcome to VibeSynth/ })).toBeVisible()
  })

  test('Hamburger > Settings navigates to settings', async ({ page }) => {
    await page.locator('button').filter({ has: page.locator('svg path[d="M3 12h18M3 6h18M3 18h18"]') }).click()
    await page.getByText('Settings').click()
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
  })

  test('Hamburger > Appearance toggles dark mode', async ({ page }) => {
    // Ensure light mode first
    const wasDark = await page.locator('html').evaluate(el => el.classList.contains('dark'))

    await page.locator('button').filter({ has: page.locator('svg path[d="M3 12h18M3 6h18M3 18h18"]') }).click()
    await page.getByText('Appearance').click()

    const isDarkNow = await page.locator('html').evaluate(el => el.classList.contains('dark'))
    expect(isDarkNow).toBe(!wasDark)
  })
})

test.describe('Settings page navigation', () => {
  test('Settings back button returns to dashboard', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Settings' }).click()
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()

    // Click back arrow
    await page.locator('header button').first().click()
    await expect(page.getByRole('heading', { name: /Welcome to VibeSynth/ })).toBeVisible()
  })
})
