import { test as setup, expect } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const authFile = join(__dirname, '../playwright/.auth/admin.json');
const adminEmail = process.env.ADMIN_EMAIL || 'muadh@sunnahskills.com';
const adminPassword = process.env.ADMIN_PASSWORD || 'testpassword123';

/**
 * Admin authentication setup.
 * Runs once before all dependent test projects via project dependencies.
 * Saves session cookie/storage to playwright/.auth/admin.json.
 *
 * Credentials come from .dev.vars.test (loaded by wrangler dev:test server):
 *   ADMIN_EMAIL=muadh@sunnahskills.com
 *   ADMIN_PASSWORD=testpassword123
 */
setup('authenticate as admin', async ({ page }) => {
  // Admin login is at /admin (the SPA route that shows AdminLogin component)
  await page.goto('/admin');

  // Wait for the login form to be visible
  await page.waitForSelector('#admin-email', { timeout: 15_000 });

  // Labels are associated via htmlFor="admin-email" / htmlFor="admin-password"
  await page.getByLabel('Email').fill(adminEmail);
  await page.getByLabel('Password').fill(adminPassword);
  await page.getByRole('button', { name: /sign in/i }).click();

  // Wait for redirect to dashboard after successful login
  await page.waitForURL('/admin/dashboard', { timeout: 15_000 });

  // Save authenticated session state
  await page.context().storageState({ path: authFile });
});
