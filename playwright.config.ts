import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  projects: [
    {
      name: 'vibesynth',
      testIgnore: /stitch-/,
      use: {
        baseURL: 'http://localhost:5173',
        screenshot: 'only-on-failure',
      },
    },
    {
      name: 'stitch',
      testMatch: /stitch-/,
      use: {
        baseURL: 'https://stitch.withgoogle.com',
        screenshot: 'only-on-failure',
        viewport: { width: 1400, height: 900 },
      },
    },
    {
      name: 'parity',
      testMatch: /parity-/,
      use: {
        screenshot: 'on',
        viewport: { width: 1400, height: 900 },
      },
    },
  ],
  webServer: {
    command: 'npm run dev:web',
    port: 5173,
    reuseExistingServer: true,
  },
})
