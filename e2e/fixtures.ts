import { test as base, expect, type Page } from '@playwright/test';

/**
 * Test Fixtures
 * Extends base Playwright test with custom fixtures
 */

export interface TestFixtures {
  /** Page with accessibility helpers */
  a11yPage: Page;

  /** Page with mobile viewport */
  mobilePage: Page;

  /** Page with tablet viewport */
  tabletPage: Page;

  /** Authenticated admin page */
  adminPage: Page;
}

/**
 * Extended test with fixtures
 */
export const test = base.extend<TestFixtures>({
  // Accessibility-enabled page
  a11yPage: async ({ page }, use) => {
    // Inject axe-core
    await page.addInitScript(() => {
      // axe-core will be injected via test utils
    });
    await use(page);
  },

  // Mobile viewport page
  mobilePage: async ({ browser }, use) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  // Tablet viewport page
  tabletPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      viewport: { width: 1024, height: 768 },
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X)',
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  // Authenticated admin page
  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Navigate to admin login using accessible locators
    await page.goto('/admin/login');
    await page.getByLabel(/email/i).fill(process.env.ADMIN_EMAIL || 'muadh@sunnahskills.com');
    await page.getByLabel(/password/i).fill(process.env.ADMIN_PASSWORD || 'testpassword123');
    await page.getByRole('button', { name: /sign in|login/i }).click();

    // Wait for dashboard to load
    await page.waitForURL(/\/admin/, { timeout: 10000 });

    await use(page);
    await context.close();
  },
});

export { expect };

/**
 * Test data generators
 */
export const generateTestData = {
  guardian: () => ({
    fullName: `Test Guardian ${Date.now()}`,
    email: `test.guardian.${Date.now()}@example.com`,
    phone: '555-0123',
    address: '123 Test Street',
    city: 'Test City',
    state: 'CA',
    zipCode: '90210',
  }),

  student: () => ({
    fullName: `Test Student ${Date.now()}`,
    dateOfBirth: '2010-05-15',
    age: 14,
    gender: 'male' as const,
    medicalNotes: 'No known allergies',
  }),

  registration: () => ({
    programSlug: 'bjj',
    siblingCount: 0,
    discountCode: '',
  }),
};

/**
 * Navigation helpers
 */
export const navigateTo = {
  home: async (page: Page) => page.goto('/'),
  programs: async (page: Page) => page.goto('/programs'),
  program: async (page: Page, slug: string) => page.goto(`/programs/${slug}`),
  schedule: async (page: Page) => page.goto('/schedule'),
  about: async (page: Page) => page.goto('/about'),
  contact: async (page: Page) => page.goto('/contact'),
  register: async (page: Page) => page.goto('/register'),
  registerProgram: async (page: Page, slug: string) => page.goto(`/programs/${slug}/register`),
  admin: async (page: Page) => page.goto('/admin'),
  adminDashboard: async (page: Page) => page.goto('/admin/dashboard'),
};

/**
 * Wait helpers
 */
export const waitFor = {
  // Wait for page to be fully loaded including React render
  pageLoad: async (page: Page) => {
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('load').catch(() => {});
    // Wait for React SPA to mount (nav is always rendered by App.tsx)
    await page.waitForSelector('nav, main, [role="main"]', { timeout: 15_000 }).catch(() => {});
    await page.waitForTimeout(150);
  },

  // Wait for animations to complete
  animations: async (page: Page) => {
    await page.waitForTimeout(500);
  },

  // Wait for toast notification
  toast: async (page: Page, text?: string) => {
    const selector = text
      ? `[data-sonner-toast]:has-text("${text}")`
      : '[data-sonner-toast]';
    await page.waitForSelector(selector, { timeout: 5000 });
  },
};
