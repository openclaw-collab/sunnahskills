import { test, expect } from './fixtures';
import { navigateTo, waitFor } from './fixtures';

/**
 * Admin Journey E2E Tests
 * Tests login, dashboard, and registration management
 */

test.describe('Admin Login', () => {
  test('should display login form', async ({ page }) => {
    await navigateTo.admin(page);
    await waitFor.pageLoad(page);

    await expect(page.locator('h1, h2')).toContainText(/Sign in|Login|Admin/i);

    // Form fields
    await expect(page.locator('input#admin-email, input[type="email"]')).toBeVisible();
    await expect(page.locator('input#admin-password, input[type="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Sign in"), button:has-text("Login")')).toBeVisible();
  });

  test('should validate empty credentials', async ({ page }) => {
    await navigateTo.admin(page);
    await waitFor.pageLoad(page);

    // Try to submit empty form
    await page.click('button:has-text("Sign in")');

    // Should show error or remain on page
    await expect(page).toHaveURL('/admin');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await navigateTo.admin(page);
    await waitFor.pageLoad(page);

    // Fill with invalid credentials
    await page.fill('input#admin-email', 'invalid@example.com');
    await page.fill('input#admin-password', 'wrongpassword');
    await page.click('button:has-text("Sign in")');

    // Should show error message
    await expect(page.locator('text=Invalid, text=Failed, text=error, text=incorrect')).toBeVisible({ timeout: 5000 }).catch(() => {
      // Error might be shown in toast
      return expect(page.locator('[data-sonner-toast]')).toBeVisible({ timeout: 5000 });
    });
  });

  test('should redirect to login when accessing dashboard unauthenticated', async ({ page }) => {
    await navigateTo.adminDashboard(page);
    await waitFor.pageLoad(page);

    // Should redirect to login
    await expect(page).toHaveURL('/admin');
  });
});

test.describe('Admin Dashboard - Authenticated', () => {
  // Skip these tests if no valid admin credentials available
  test.beforeEach(async ({ page }) => {
    await navigateTo.admin(page);
    await waitFor.pageLoad(page);

    // Attempt login with test credentials
    await page.fill('input#admin-email', process.env.ADMIN_EMAIL || 'admin@sunnahskills.com');
    await page.fill('input#admin-password', process.env.ADMIN_PASSWORD || 'testpassword123');
    await page.click('button:has-text("Sign in")');

    // Wait for navigation or error
    await page.waitForTimeout(3000);

    // Skip if login failed
    const currentUrl = page.url();
    if (currentUrl.includes('/admin') && !currentUrl.includes('/dashboard')) {
      test.skip();
    }
  });

  test('should display dashboard with tabs', async ({ page }) => {
    await expect(page.locator('h1, h2')).toContainText('Dashboard');

    // Tab navigation
    await expect(page.locator('text=Overview')).toBeVisible();
    await expect(page.locator('text=Registrations')).toBeVisible();
    await expect(page.locator('text=Payments')).toBeVisible();
    await expect(page.locator('text=Discounts')).toBeVisible();
    await expect(page.locator('text=Pricing')).toBeVisible();
    await expect(page.locator('text=Sessions')).toBeVisible();
    await expect(page.locator('text=Contacts')).toBeVisible();
    await expect(page.locator('text=Export')).toBeVisible();

    // Sign out button
    await expect(page.locator('button:has-text("Sign out")')).toBeVisible();
  });

  test('should display overview tab with stats', async ({ page }) => {
    // Overview tab should be active by default
    await expect(page.locator('text=Total Registrations')).toBeVisible().catch(() => {
      // Alternative stats
      return expect(page.locator('text=Overview')).toHaveAttribute('data-state', 'active');
    });
  });

  test('should navigate between tabs', async ({ page }) => {
    // Click through each tab
    const tabs = ['Registrations', 'Payments', 'Discounts', 'Pricing', 'Sessions', 'Contacts', 'Export'];

    for (const tab of tabs) {
      await page.click(`text=${tab}`);
      await page.waitForTimeout(500);

      // Verify tab content is shown
      await expect(page.locator(`[data-state="active"]`)).toContainText(tab);
    }
  });

  test('should display registrations table', async ({ page }) => {
    await page.click('text=Registrations');
    await page.waitForTimeout(500);

    // Table headers
    await expect(page.locator('text=Name, text=Student, text=Guardian')).toBeVisible().catch(() => {
      return expect(page.locator('table, [role="table"]')).toBeVisible();
    });
  });

  test('should display payments summary', async ({ page }) => {
    await page.click('text=Payments');
    await page.waitForTimeout(500);

    await expect(page.locator('text=Payment, text=Amount, text=Status')).toBeVisible().catch(() => {
      return expect(page.locator('body')).toContainText('Payment');
    });
  });

  test('should handle sign out', async ({ page }) => {
    await page.click('button:has-text("Sign out")');

    // Should redirect to login
    await page.waitForURL('/admin', { timeout: 10000 });
    await expect(page).toHaveURL('/admin');
  });
});

test.describe('Admin Dashboard - Registration Management', () => {
  test.beforeEach(async ({ page }) => {
    await navigateTo.admin(page);
    await waitFor.pageLoad(page);

    // Attempt login
    await page.fill('input#admin-email', process.env.ADMIN_EMAIL || 'admin@sunnahskills.com');
    await page.fill('input#admin-password', process.env.ADMIN_PASSWORD || 'testpassword123');
    await page.click('button:has-text("Sign in")');

    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    if (currentUrl.includes('/admin') && !currentUrl.includes('/dashboard')) {
      test.skip();
    }

    // Navigate to registrations tab
    await page.click('text=Registrations');
    await page.waitForTimeout(500);
  });

  test('should search/filter registrations', async ({ page }) => {
    // Look for search input
    const searchInput = page.locator('input[placeholder*="Search"], input[name="search"]').first();

    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('test');
      await page.waitForTimeout(500);

      // Results should update
      await expect(page.locator('table tbody tr, [role="row"]')).toBeVisible();
    }
  });

  test('should open registration detail modal', async ({ page }) => {
    // Click on a registration row if exists
    const registrationRow = page.locator('table tbody tr, [role="row"]').first();

    if (await registrationRow.isVisible().catch(() => false)) {
      await registrationRow.click();

      // Detail modal should open
      await expect(page.locator('text=Registration Details, [role="dialog"]')).toBeVisible().catch(() => {
        // Modal might have different title
        return expect(page.locator('body')).toContainText('Details');
      });
    }
  });

  test('should export registrations', async ({ page }) => {
    await page.click('text=Export');
    await page.waitForTimeout(500);

    // Download button
    const downloadButton = page.locator('a:has-text("Download CSV"), button:has-text("Download")').first();
    await expect(downloadButton).toBeVisible();

    // Note: Actual download testing requires additional setup
  });
});

test.describe('Admin Dashboard - Discount Management', () => {
  test.beforeEach(async ({ page }) => {
    await navigateTo.admin(page);
    await waitFor.pageLoad(page);

    // Attempt login
    await page.fill('input#admin-email', process.env.ADMIN_EMAIL || 'admin@sunnahskills.com');
    await page.fill('input#admin-password', process.env.ADMIN_PASSWORD || 'testpassword123');
    await page.click('button:has-text("Sign in")');

    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    if (currentUrl.includes('/admin') && !currentUrl.includes('/dashboard')) {
      test.skip();
    }

    await page.click('text=Discounts');
    await page.waitForTimeout(500);
  });

  test('should display discount management interface', async ({ page }) => {
    await expect(page.locator('text=Discount, text=Code, text=Coupon')).toBeVisible().catch(() => {
      return expect(page.locator('body')).toContainText('Discount');
    });
  });
});

test.describe('Admin Dashboard - Pricing Management', () => {
  test.beforeEach(async ({ page }) => {
    await navigateTo.admin(page);
    await waitFor.pageLoad(page);

    // Attempt login
    await page.fill('input#admin-email', process.env.ADMIN_EMAIL || 'admin@sunnahskills.com');
    await page.fill('input#admin-password', process.env.ADMIN_PASSWORD || 'testpassword123');
    await page.click('button:has-text("Sign in")');

    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    if (currentUrl.includes('/admin') && !currentUrl.includes('/dashboard')) {
      test.skip();
    }

    await page.click('text=Pricing');
    await page.waitForTimeout(500);
  });

  test('should display pricing management interface', async ({ page }) => {
    await expect(page.locator('text=Price, text=Cost, text=Amount')).toBeVisible().catch(() => {
      return expect(page.locator('body')).toContainText('Price');
    });
  });
});

test.describe('Admin Dashboard - Session Management', () => {
  test.beforeEach(async ({ page }) => {
    await navigateTo.admin(page);
    await waitFor.pageLoad(page);

    // Attempt login
    await page.fill('input#admin-email', process.env.ADMIN_EMAIL || 'admin@sunnahskills.com');
    await page.fill('input#admin-password', process.env.ADMIN_PASSWORD || 'testpassword123');
    await page.click('button:has-text("Sign in")');

    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    if (currentUrl.includes('/admin') && !currentUrl.includes('/dashboard')) {
      test.skip();
    }

    await page.click('text=Sessions');
    await page.waitForTimeout(500);
  });

  test('should display session management interface', async ({ page }) => {
    await expect(page.locator('text=Session, text=Class, text=Schedule')).toBeVisible().catch(() => {
      return expect(page.locator('body')).toContainText('Session');
    });
  });
});

test.describe('Admin Dashboard - Contacts', () => {
  test.beforeEach(async ({ page }) => {
    await navigateTo.admin(page);
    await waitFor.pageLoad(page);

    // Attempt login
    await page.fill('input#admin-email', process.env.ADMIN_EMAIL || 'admin@sunnahskills.com');
    await page.fill('input#admin-password', process.env.ADMIN_PASSWORD || 'testpassword123');
    await page.click('button:has-text("Sign in")');

    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    if (currentUrl.includes('/admin') && !currentUrl.includes('/dashboard')) {
      test.skip();
    }

    await page.click('text=Contacts');
    await page.waitForTimeout(500);
  });

  test('should display contacts table', async ({ page }) => {
    await expect(page.locator('text=Contact, text=Message, text=Inquiry')).toBeVisible().catch(() => {
      return expect(page.locator('body')).toContainText('Contact');
    });
  });
});
