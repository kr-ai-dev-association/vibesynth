import { test, expect } from '@playwright/test'

test.describe('Dashboard - VibeSynth vs Stitch parity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('shows welcome heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Welcome to VibeSynth/i })).toBeVisible()
  })

  test('has logo with BETA badge', async ({ page }) => {
    await expect(page.getByText('VibeSynth', { exact: true })).toBeVisible()
    await expect(page.getByText('BETA')).toBeVisible()
  })

  test('has left sidebar with My projects and Examples', async ({ page }) => {
    await expect(page.getByRole('button', { name: /My projects/ })).toBeVisible()
    await expect(page.getByText('Examples')).toBeVisible()
    await expect(page.getByText('Indoor Plant Care Dashboard')).toBeVisible()
  })

  test('has sidebar tabs: My projects / Shared with me', async ({ page }) => {
    await expect(page.getByRole('button', { name: /My projects/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Shared with me/ })).toBeVisible()
  })

  test('has search input', async ({ page }) => {
    await expect(page.getByPlaceholder('Search projects')).toBeVisible()
  })

  test('has prompt suggestion chips', async ({ page }) => {
    const chips = page.getByRole('button').filter({ hasText: /recipe|browse tab|fitness/ })
    await expect(chips.first()).toBeVisible()
  })

  test('has prompt bar with App/Tablet/Web toggle', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'App', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Tablet', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Web', exact: true })).toBeVisible()
  })

  test('App/Web toggle changes placeholder text', async ({ page }) => {
    await expect(page.getByPlaceholder(/mobile app/)).toBeVisible()
    await page.getByRole('button', { name: 'Web', exact: true }).click()
    await expect(page.getByPlaceholder(/web experience/)).toBeVisible()
  })

  test('has model selector with 3.0 Flash as default', async ({ page }) => {
    await expect(page.getByRole('button', { name: /3\.0 Flash/ })).toBeVisible()
  })

  test('model selector shows 4 options', async ({ page }) => {
    await page.getByRole('button', { name: /3\.0 Flash/ }).click()
    await expect(page.getByText('3.0 Quality', { exact: true })).toBeVisible()
    await expect(page.getByText('Redesign', { exact: true })).toBeVisible()
    await expect(page.getByText('Ideate', { exact: true })).toBeVisible()
  })

  test('has appearance toggle', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Appearance' })).toBeVisible()
  })

  test('appearance toggle shows Light/System/Dark', async ({ page }) => {
    await page.getByRole('button', { name: 'Appearance' }).click()
    await expect(page.getByRole('button', { name: 'Light', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'System', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Dark', exact: true })).toBeVisible()
  })

  test('clicking example project navigates to editor', async ({ page }) => {
    await page.getByText('Indoor Plant Care Dashboard').click()
    await expect(page.getByText('Indoor Plant Care Dashboard')).toBeVisible()
    await expect(page.getByRole('button', { name: /Run/ })).toBeVisible()
  })
})
