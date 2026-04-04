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
    // Kill any existing process on port 5199 before starting
    command: 'lsof -ti :5199 | xargs kill -9 2>/dev/null; sleep 1; VIBESYNTH_NO_ELECTRON=1 ELECTRON_RUN_AS_NODE= npx vite --port 5199 --strictPort',
    port: 5199,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
