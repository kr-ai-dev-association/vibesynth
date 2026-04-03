import { test, expect } from '@playwright/test'

test.describe('Editor - VibeSynth vs Stitch parity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.getByText('Indoor Plant Care Dashboard').click()
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

  test('has right panel with Design/Components/Layers tabs', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Design' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Components' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Layers' })).toBeVisible()
  })

  test('right panel shows design system (placeholder or generated)', async ({ page }) => {
    const colorPalette = page.getByText('Color Palette')
    const generatingDs = page.getByText('Generating design system...')
    await expect(colorPalette.or(generatingDs)).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=Primary').first()).toBeVisible()
    await expect(page.locator('text=Secondary').first()).toBeVisible()
    await expect(page.locator('text=Tertiary').first()).toBeVisible()
    await expect(page.locator('text=Neutral').first()).toBeVisible()
  })

  test('right panel has typography or generating state', async ({ page }) => {
    const typography = page.getByText('Typography', { exact: true })
    const generatingDs = page.getByText('Generating design system...', { exact: true })
    await expect(typography.or(generatingDs).first()).toBeVisible()
  })

  test('right panel Components tab shows component library', async ({ page }) => {
    await page.getByRole('button', { name: 'Components' }).click()
    await expect(page.getByText('Buttons')).toBeVisible()
    await expect(page.getByText('Search Bar')).toBeVisible()
    await expect(page.getByText('Bottom Navigation', { exact: true })).toBeVisible()
    await expect(page.getByText('FAB')).toBeVisible()
    await expect(page.getByText('Chips')).toBeVisible()
  })

  test('right panel Layers tab shows screen list', async ({ page }) => {
    await page.getByRole('button', { name: 'Layers' }).click()
    await expect(page.getByText(/Screens \(\d+\)/)).toBeVisible()
  })

  test('right panel has Design Guide section when design system loaded', async ({ page }) => {
    const guideLabel = page.getByText('Design Guide')
    const generatingDs = page.getByText('Generating design system...', { exact: true })

    // Either generating (placeholder) or design loaded (shows guide)
    const isGenerating = await generatingDs.isVisible().catch(() => false)
    if (!isGenerating) {
      await expect(guideLabel).toBeVisible()
    } else {
      await expect(generatingDs).toBeVisible()
    }
  })

  test('right panel can be collapsed and reopened', async ({ page }) => {
    await page.getByTitle('Close panel').click()
    await expect(page.getByRole('button', { name: 'Design' })).not.toBeVisible()

    await page.getByTitle('Open panel').click()
    await expect(page.getByRole('button', { name: 'Design' })).toBeVisible()
  })

  test('shows empty state or generating state when no screens', async ({ page }) => {
    const generating = page.getByText('Generating your design...')
    const emptyPrompt = page.getByText('Enter a prompt to generate a screen')
    const generatingIndicator = page.getByText('Generating...')

    await expect(
      generating.or(emptyPrompt).or(generatingIndicator)
    ).toBeVisible({ timeout: 5000 })
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

  test('agent log shows generation activity', async ({ page }) => {
    await expect(
      page.getByText(/Generating design|Generation failed/).first()
    ).toBeVisible({ timeout: 10000 })
  })
})
