import { test, expect } from '@playwright/test'

test.describe('Editor - VibeSynth vs Stitch parity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /Indoor Plant Care/ }).click()
  })

  test('shows project name in header', async ({ page }) => {
    await expect(page.getByText('Indoor Plant Care Dashboard')).toBeVisible()
  })

  test('has hamburger menu', async ({ page }) => {
    await page.locator('header button').first().click()
    await expect(page.getByText('Go to all projects')).toBeVisible()
    await expect(page.getByText('Open project folder')).toBeVisible()
    await expect(page.getByText('Command menu')).toBeVisible()
  })

  test('has Run button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Run/ })).toBeVisible()
  })

  test('has left toolbar with tools', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Cursor' }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Pen' }).first()).toBeVisible()
  })

  test('has design system card with Kinetic Volt', async ({ page }) => {
    await expect(page.getByText('Kinetic Volt')).toBeVisible()
    await expect(page.getByText('#CCFF00')).toBeVisible()
  })

  test('design system card has all 4 color roles', async ({ page }) => {
    await expect(page.locator('text=Primary').first()).toBeVisible()
    await expect(page.locator('text=Secondary').first()).toBeVisible()
    await expect(page.locator('text=Tertiary').first()).toBeVisible()
    await expect(page.locator('text=Neutral').first()).toBeVisible()
  })

  test('design system card has typography section', async ({ page }) => {
    await expect(page.getByText('Lexend').first()).toBeVisible()
  })

  test('has screen placeholders', async ({ page }) => {
    await expect(page.getByText('390 x 844').first()).toBeVisible()
    await expect(page.getByText('Workout Plans')).toBeVisible()
    await expect(page.getByText('Progress Charts')).toBeVisible()
  })

  test('clicking screen shows context toolbar', async ({ page }) => {
    // Click on the screen placeholder area (the 390x844 box)
    await page.getByText('390 x 844').first().click()
    await expect(page.locator('header').getByText('Generate')).toBeVisible()
    await expect(page.locator('header').getByText('Modify')).toBeVisible()
    await expect(page.locator('header').getByText('More')).toBeVisible()
  })

  test('Generate menu has correct items', async ({ page }) => {
    await page.getByText('390 x 844').first().click()
    await page.locator('header').getByText('Generate').click()
    await expect(page.getByText('Variations')).toBeVisible()
    await expect(page.getByText('Regenerate')).toBeVisible()
  })

  test('right-click shows full context menu', async ({ page }) => {
    await page.getByText('Workout Plans').click({ button: 'right' })
    await expect(page.getByRole('button', { name: 'Copy ⌘C' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Cut ⌘X' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Duplicate/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Focus/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Delete/ })).toBeVisible()
    await expect(page.getByText('GENERATE', { exact: true })).toBeVisible()
    await expect(page.getByText('EDIT', { exact: true })).toBeVisible()
    await expect(page.getByText('RUN', { exact: true })).toBeVisible()
  })

  test('has bottom prompt bar', async ({ page }) => {
    await expect(page.getByPlaceholder('What would you like to change or create?')).toBeVisible()
  })

  test('has agent log panel', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Agent log' })).toBeVisible()
  })

  test('has zoom indicator', async ({ page }) => {
    await expect(page.getByText('100%')).toBeVisible()
  })
})
