import { test, expect } from './fixtures';
import { navigateTo, waitFor } from './fixtures';

/**
 * Public Pages E2E Tests
 * Tests homepage, navigation, program pages, and schedule
 */

test.describe('Homepage', () => {
  test('should load homepage with all key elements', async ({ page }) => {
    await navigateTo.home(page);
    await waitFor.pageLoad(page);

    // Hero section
    await expect(page.locator('h1')).toContainText('Built Through');
    await expect(page.locator('h1')).toContainText('Discipline');

    // Navigation
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('nav')).toContainText('Sunnah Skills');

    // CTA buttons
    await expect(page.locator('a:has-text("Register Now")').first()).toBeVisible();
    await expect(page.locator('a:has-text("View Schedule")').first()).toBeVisible();

    // Telemetry section
    await expect(page.locator('text=Academy Telemetry')).toBeVisible();

    // Programs section
    await expect(page.locator('text=Core Curriculum').first()).toBeVisible();
    await expect(page.locator('text=Brazilian Jiu-Jitsu').first()).toBeVisible();
    await expect(page.locator('text=Traditional Archery').first()).toBeVisible();
    await expect(page.locator('text=Outdoor Workshops').first()).toBeVisible();
    await expect(page.locator('text=Bullyproofing').first()).toBeVisible();

    // Testimonials
    await expect(page.locator('text=What Parents Say')).toBeVisible();
  });

  test('should navigate to registration from hero CTA', async ({ page }) => {
    await navigateTo.home(page);
    await waitFor.pageLoad(page);

    await page.click('a:has-text("Register Now")');
    await page.waitForURL('/register', { timeout: 10000 });

    await expect(page.locator('h1, h2').first()).toContainText('Choose a Program');
  });

  test('should navigate to schedule from hero CTA', async ({ page }) => {
    await navigateTo.home(page);
    await waitFor.pageLoad(page);

    await page.click('a:has-text("View Schedule")');
    await page.waitForURL('/schedule', { timeout: 10000 });

    await expect(page.locator('h1, h2').first()).toContainText('Weekly Program Times');
  });

  test('should have working scroll animations', async ({ page }) => {
    await navigateTo.home(page);
    await waitFor.pageLoad(page);

    // Scroll to programs section
    await page.locator('text=Core Curriculum').scrollIntoViewIfNeeded();
    await waitFor.animations(page);

    // Verify elements are visible after scroll
    await expect(page.locator('text=Brazilian Jiu-Jitsu').first()).toBeVisible();
  });
});

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await navigateTo.home(page);
    await waitFor.pageLoad(page);
  });

  test('should have working main navigation links', async ({ page }) => {
    // Programs dropdown
    await page.hover('text=Programs');
    await expect(page.locator('role=menu')).toContainText('All Programs');
    await expect(page.locator('role=menu')).toContainText('Brazilian Jiu-Jitsu');
    await expect(page.locator('role=menu')).toContainText('Traditional Archery');

    // Direct links
    await page.click('a:has-text("Schedule")');
    await page.waitForURL('/schedule', { timeout: 10000 });
    await expect(page).toHaveURL('/schedule');

    await page.goto('/');
    await page.click('a:has-text("About")');
    await page.waitForURL('/about', { timeout: 10000 });
    await expect(page).toHaveURL('/about');

    await page.goto('/');
    await page.click('a:has-text("Contact")');
    await page.waitForURL('/contact', { timeout: 10000 });
    await expect(page).toHaveURL('/contact');
  });

  test('should have working mobile navigation', async ({ mobilePage }) => {
    await navigateTo.home(mobilePage);
    await waitFor.pageLoad(mobilePage);

    // Open mobile menu
    await mobilePage.click('button[aria-label="Toggle navigation"]');

    // Verify mobile menu items
    await expect(mobilePage.locator('text=Programs').first()).toBeVisible();
    await expect(mobilePage.locator('text=Schedule').first()).toBeVisible();
    await expect(mobilePage.locator('text=About').first()).toBeVisible();
    await expect(mobilePage.locator('text=Contact').first()).toBeVisible();
    await expect(mobilePage.locator('button:has-text("Register Now")')).toBeVisible();

    // Navigate via mobile menu
    await mobilePage.locator('text=Schedule').first().click();
    await mobilePage.waitForURL('/schedule', { timeout: 10000 });
    await expect(mobilePage).toHaveURL('/schedule');
  });

  test('should navigate to all programs from dropdown', async ({ page }) => {
    await page.hover('text=Programs');

    // BJJ
    await page.click('role=menuitem:has-text("Brazilian Jiu-Jitsu")');
    await page.waitForURL('/programs/bjj', { timeout: 10000 });
    await expect(page.locator('h1, h2').first()).toContainText('Brazilian Jiu-Jitsu');

    // Back and try archery
    await page.goto('/');
    await page.hover('text=Programs');
    await page.click('role=menuitem:has-text("Traditional Archery")');
    await page.waitForURL('/programs/archery', { timeout: 10000 });
    await expect(page.locator('h1, h2').first()).toContainText('Archery');
  });
});

test.describe('Program Pages', () => {
  const programs = [
    { slug: 'bjj', name: 'Brazilian Jiu-Jitsu', expectedContent: ['grappling', '5-11 years'] },
    { slug: 'archery', name: 'Archery', expectedContent: ['Traditional Archery', 'Seasonal'] },
    { slug: 'outdoor', name: 'Outdoor', expectedContent: ['Outdoor Workshops', 'wilderness'] },
    { slug: 'bullyproofing', name: 'Bullyproofing', expectedContent: ['Bullyproofing', 'confidence'] },
  ];

  for (const program of programs) {
    test(`should load ${program.name} program page`, async ({ page }) => {
      await navigateTo.program(page, program.slug);
      await waitFor.pageLoad(page);

      // Verify page title/content
      await expect(page.locator('h1, h2').first()).toContainText(program.name.replace('Outdoor', '').trim());

      // Verify expected content
      for (const content of program.expectedContent) {
        await expect(page.locator('body')).toContainText(content);
      }

      // Verify registration CTA exists
      await expect(page.locator('a:has-text("Register"), button:has-text("Register")').first()).toBeVisible();
    });

    test(`should navigate to registration from ${program.name} page`, async ({ page }) => {
      await navigateTo.program(page, program.slug);
      await waitFor.pageLoad(page);

      // Find and click register button
      const registerButton = page.locator('a:has-text("Register"), button:has-text("Register")').first();
      await registerButton.click();

      await page.waitForURL(`/programs/${program.slug}/register`, { timeout: 10000 });
      await expect(page).toHaveURL(`/programs/${program.slug}/register`);
    });
  }

  test('should load programs listing page', async ({ page }) => {
    await navigateTo.programs(page);
    await waitFor.pageLoad(page);

    await expect(page.locator('h1, h2').first()).toContainText('Choose a Track');

    // All programs should be listed
    await expect(page.locator('text=Brazilian Jiu-Jitsu').first()).toBeVisible();
    await expect(page.locator('text=Traditional Archery').first()).toBeVisible();
    await expect(page.locator('text=Outdoor Workshops').first()).toBeVisible();
    await expect(page.locator('text=Bullyproofing').first()).toBeVisible();
  });
});

test.describe('Schedule Page', () => {
  test('should load schedule page with weekly view', async ({ page }) => {
    await navigateTo.schedule(page);
    await waitFor.pageLoad(page);

    await expect(page.locator('h1, h2').first()).toContainText('Weekly Program Times');

    // Weekly view elements
    await expect(page.locator('text=Boys\' Classes').first()).toBeVisible();
    await expect(page.locator('text=Girls\' Classes').first()).toBeVisible();
    await expect(page.locator('text=Mixed Programs').first()).toBeVisible();

    // Schedule items
    await expect(page.locator('text=BJJ Fundamentals').first()).toBeVisible();
    await expect(page.locator('text=BJJ Advanced').first()).toBeVisible();
  });

  test('should toggle between weekly and monthly views', async ({ page }) => {
    await navigateTo.schedule(page);
    await waitFor.pageLoad(page);

    // Default weekly view
    await expect(page.locator('text=Boys\' Classes').first()).toBeVisible();

    // Switch to monthly view
    await page.click('button:has-text("monthly")');
    await expect(page.locator('text=Monthly view')).toBeVisible();
    await expect(page.locator('text=March 2026')).toBeVisible();

    // Switch back to weekly
    await page.click('button:has-text("weekly")');
    await expect(page.locator('text=Boys\' Classes').first()).toBeVisible();
  });

  test('should have register links for each class', async ({ page }) => {
    await navigateTo.schedule(page);
    await waitFor.pageLoad(page);

    // Hover over schedule row to reveal register link
    const scheduleRow = page.locator('text=BJJ Fundamentals').first();
    await scheduleRow.hover();

    // Verify register link appears
    await expect(page.locator('text=Register →').first()).toBeVisible();
  });

  test('should display break alert when applicable', async ({ page }) => {
    await navigateTo.schedule(page);
    await waitFor.pageLoad(page);

    // Classes on break alert
    await expect(page.locator('text=Classes Currently On Break')).toBeVisible();
  });
});

test.describe('About Page', () => {
  test('should load about page', async ({ page }) => {
    await navigateTo.about(page);
    await waitFor.pageLoad(page);

    await expect(page.locator('h1, h2').first()).toContainText('About');
    await expect(page.locator('body')).toContainText('Sunnah Skills');
  });
});

test.describe('Contact Page', () => {
  test('should load contact page with form', async ({ page }) => {
    await navigateTo.contact(page);
    await waitFor.pageLoad(page);

    await expect(page.locator('h1, h2').first()).toContainText('Contact');

    // Form fields
    await expect(page.locator('input[name="name"], #name')).toBeVisible();
    await expect(page.locator('input[name="email"], #email')).toBeVisible();
    await expect(page.locator('textarea[name="message"], #message')).toBeVisible();
    await expect(page.locator('button:has-text("Send")')).toBeVisible();
  });

  test('should validate contact form', async ({ page }) => {
    await navigateTo.contact(page);
    await waitFor.pageLoad(page);

    // Submit empty form
    await page.click('button:has-text("Send")');

    // Should show validation errors or stay on page
    await expect(page).toHaveURL('/contact');
  });
});

test.describe('404 Page', () => {
  test('should show 404 for non-existent routes', async ({ page }) => {
    await page.goto('/non-existent-page-12345');
    await waitFor.pageLoad(page);

    await expect(page.locator('h1, h2').first()).toContainText(/404|Not Found|Page not found/i);
    await expect(page.locator('a:has-text("Home"), button:has-text("Home")')).toBeVisible();
  });
});
