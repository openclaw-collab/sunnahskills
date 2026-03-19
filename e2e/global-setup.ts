import { chromium, type FullConfig } from '@playwright/test';

/**
 * Global Setup
 * Runs once before all test suites
 */
async function globalSetup(config: FullConfig) {
  console.log('Starting global setup...');

  // Create admin session for authenticated tests
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Pre-warm the dev server
    await page.goto('/', { timeout: 60000, waitUntil: 'networkidle' });
    console.log('Dev server warmed up successfully');
  } catch (error) {
    console.warn('Could not warm up server, tests will retry:', error);
  }

  await browser.close();
  console.log('Global setup complete');
}

export default globalSetup;
