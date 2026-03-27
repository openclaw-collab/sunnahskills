import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TEST_PORT = 8789;
const BASE_URL = `http://localhost:${TEST_PORT}`;

/**
 * Playwright E2E Test Configuration for Sunnah Skills
 *
 * Test server: Miniflare (local SQLite) on port 8789 — no Cloudflare account needed.
 * Dev server: Vite/wrangler on port 8788 — unaffected by test runs.
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ['html', { open: 'never' }],
    ['list'],
    ['json', { outputFile: 'test-results/e2e-results.json' }],
  ],

  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
    },
  },

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  projects: [
    // Auth setup — runs first, creates playwright/.auth/admin.json
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },

    // Primary browser — Chromium only for speed
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/admin.json',
      },
      dependencies: ['setup'],
    },

    // Enable additional browsers as needed:
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'], storageState: 'playwright/.auth/admin.json' },
    //   dependencies: ['setup'],
    // },
    // {
    //   name: 'mobile-chrome',
    //   use: { ...devices['Pixel 7'], storageState: 'playwright/.auth/admin.json' },
    //   dependencies: ['setup'],
    // },
  ],

  // Server lifecycle is managed by globalSetup / globalTeardown.
  // globalSetup builds, seeds the DB, and starts wrangler pages dev.
  // globalTeardown kills the server process.

  globalSetup: resolve(__dirname, './e2e/global-setup.ts'),
  globalTeardown: resolve(__dirname, './e2e/global-teardown.ts'),

  outputDir: 'test-results/',
});
