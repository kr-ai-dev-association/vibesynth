import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 300_000,
  expect: {
    timeout: 60_000,
  },
  workers: 1,
  retries: 0,
  outputDir: 'test-results',
  webServer: {
    command: 'VIBESYNTH_NO_ELECTRON=1 ELECTRON_RUN_AS_NODE= npx vite --port 5199',
    port: 5199,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
