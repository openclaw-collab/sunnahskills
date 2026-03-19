import { type FullConfig } from '@playwright/test';

/**
 * Global Teardown
 * Runs once after all test suites complete
 */
async function globalTeardown(config: FullConfig) {
  console.log('Starting global teardown...');

  // Cleanup any test data if needed
  // This is where you'd clean up database entries created during tests

  console.log('Global teardown complete');
}

export default globalTeardown;
