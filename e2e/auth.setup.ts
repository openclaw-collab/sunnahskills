import { test as setup, expect } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const authFile = join(__dirname, '../playwright/.auth/admin.json');

/**
 * Admin authentication setup.
 * Runs once before all dependent test projects via project dependencies.
 * Saves session cookie/storage to playwright/.auth/admin.json.
 *
 * Credentials come from .dev.vars.test (loaded by wrangler dev:test server):
 *   ADMIN_EMAIL=admin@sunnahskills.com
 *   ADMIN_PASSWORD=testpassword123
 */
setup('authenticate as admin', async ({ page }) => {
  // Admin login is at /admin (the SPA route that shows AdminLogin component)
  await page.goto('/admin');

  // Wait for the login form to be visible
  await page.waitForSelector('#admin-email', { timeout: 15_000 });

  // Labels are associated via htmlFor="admin-email" / htmlFor="admin-password"
  await page.getByLabel('Email').fill('admin@sunnahskills.com');
  await page.getByLabel('Password').fill('testpassword123');
  await page.getByRole('button', { name: /sign in/i }).click();

  // Wait for redirect to dashboard after successful login
  await page.waitForURL('/admin/dashboard', { timeout: 15_000 });

  // Save authenticated session state
  await page.context().storageState({ path: authFile });
});
