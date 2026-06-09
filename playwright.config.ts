import process from 'node:process'
import { defineConfig, devices } from '@playwright/test'

const isCi = Boolean(process.env.CI)
const port = isCi ? 4173 : 5174
const host = '127.0.0.1'

export default defineConfig({
  testDir: './e2e',
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
  forbidOnly: isCi,
  retries: isCi ? 2 : 0,
  workers: isCi ? 1 : undefined,
  reporter: isCi ? 'github' : 'list',
  use: {
    actionTimeout: 0,
    baseURL: `http://${host}:${port}`,
    trace: 'on-first-retry',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
  webServer: {
    command: isCi
      ? 'VITE_E2E_MOCK_AUTH=1 VITE_API_BASE_URL=/api npm run preview -- --host 127.0.0.1 --port 4173 --strictPort'
      : 'VITE_E2E_MOCK_AUTH=1 VITE_API_BASE_URL=/api npm run dev -- --host 127.0.0.1 --port 5174 --strictPort',
    port,
    reuseExistingServer: false,
    timeout: 120 * 1000,
  },
})
