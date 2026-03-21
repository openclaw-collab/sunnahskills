import { execFileSync } from 'child_process';

const TEST_PORT = 8789;

/**
 * Global Teardown — kills the wrangler dev server started by global-setup.
 */
async function globalTeardown() {
  console.log('\n[global-teardown] Stopping dev server...');
  try {
    execFileSync('sh', ['-c', `lsof -ti:${TEST_PORT} | xargs kill -9`], { stdio: 'pipe' });
    console.log('[global-teardown] Dev server stopped');
  } catch {
    // already stopped
  }
  console.log('[global-teardown] E2E run complete');
}

export default globalTeardown;
