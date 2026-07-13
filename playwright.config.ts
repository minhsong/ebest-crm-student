import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.E2E_PORTAL_BASE_URL ?? 'http://localhost:3001';

/**
 * Games Hub E2E — §10.2 GAMES_HUB_IMPLEMENTATION_PLAN.md
 *
 * Chạy local:
 *   npm run dev          # terminal 1
 *   npm run test:e2e     # terminal 2
 *
 * Flow đăng nhập (optional):
 *   E2E_PORTAL_LOGIN_ID=... E2E_PORTAL_PASSWORD=... npm run test:e2e
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list']],
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'games-hub-public',
      testMatch: /games-hub\/(public|playing-mock|spelling-playing-mock|assignment-ready-mock|assignment-start-mock|checklist-ready-mock)\.spec\.ts/,
    },
    {
      name: 'setup-auth',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'games-hub-authenticated',
      testMatch: /games-hub\/authenticated\.spec\.ts/,
      dependencies: ['setup-auth'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/student.json',
      },
    },
  ],
  webServer: process.env.E2E_SKIP_WEB_SERVER
    ? undefined
    : {
        command: 'npm run dev',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
