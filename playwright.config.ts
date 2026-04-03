import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 300_000,
  expect: {
    timeout: 60_000,
  },
  workers: 1,
  retries: 0,
  use: {
    baseURL: 'http://localhost:5199',
    screenshot: 'on',
    trace: 'on-first-retry',
    launchOptions: {
      args: ['--start-maximized'],
    },
    viewport: null,
  },
  outputDir: 'test-results',
  webServer: {
    command: 'npx vite --config vite.config.web.ts --port 5199',
    port: 5199,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
})
