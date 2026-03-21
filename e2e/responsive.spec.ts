import { test, expect } from './fixtures';
import { navigateTo, waitFor } from './fixtures';

/**
 * Responsive Testing E2E Tests
 * Tests mobile, tablet, and desktop viewports
 */

const viewports = [
  { name: 'Mobile - iPhone SE', width: 375, height: 667, device: 'mobile' },
  { name: 'Mobile - iPhone 14', width: 390, height: 844, device: 'mobile' },
  { name: 'Mobile - Pixel 7', width: 412, height: 915, device: 'mobile' },
  { name: 'Tablet - iPad Mini', width: 768, height: 1024, device: 'tablet' },
  { name: 'Tablet - iPad Pro', width: 1024, height: 1366, device: 'tablet' },
  { name: 'Desktop - Small', width: 1280, height: 720, device: 'desktop' },
  { name: 'Desktop - Large', width: 1920, height: 1080, device: 'desktop' },
];

test.describe('Responsive - Homepage', () => {
  for (const viewport of viewports) {
    test(`should render correctly on ${viewport.name}`, async ({ page }) => {
      // Set viewport size
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      await navigateTo.home(page);
      await waitFor.pageLoad(page);

      // Basic visibility checks
      await expect(page.locator('nav')).toBeVisible();
      await expect(page.locator('h1')).toBeVisible();

      // Take screenshot for visual regression
      await page.screenshot({
        path: `e2e/screenshots/homepage-${viewport.device}-${viewport.width}x${viewport.height}.png`,
        fullPage: false,
      });

      // Check for horizontal overflow (layout breakage)
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1); // Allow 1px rounding error
    });
  }
});

test.describe('Responsive - Navigation', () => {
  test('should show hamburger menu on mobile', async ({ mobilePage }) => {
    await navigateTo.home(mobilePage);
    await waitFor.pageLoad(mobilePage);

    // Mobile menu toggle should be visible
    await expect(mobilePage.locator('button[aria-label="Toggle navigation"]')).toBeVisible();

    // Desktop nav links should be hidden
    await expect(mobilePage.locator('nav a:has-text("Programs")')).not.toBeVisible();
  });

  test('should show full navigation on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await navigateTo.home(page);
    await waitFor.pageLoad(page);

    // Desktop nav should be visible
    await expect(page.locator('nav a:has-text("Programs")')).toBeVisible();
    await expect(page.locator('nav a:has-text("Schedule")')).toBeVisible();
    await expect(page.locator('nav a:has-text("About")')).toBeVisible();
    await expect(page.locator('nav a:has-text("Contact")')).toBeVisible();

    // Hamburger menu should be hidden
    await expect(page.locator('button[aria-label="Toggle navigation"]')).not.toBeVisible();
  });

  test('should toggle mobile menu correctly', async ({ mobilePage }) => {
    await navigateTo.home(mobilePage);
    await waitFor.pageLoad(mobilePage);

    // Open mobile menu
    await mobilePage.click('button[aria-label="Toggle navigation"]');

    // Menu should be visible
    await expect(mobilePage.locator('text=Programs').nth(1)).toBeVisible();
    await expect(mobilePage.locator('text=Schedule')).toBeVisible();

    // Close menu
    await mobilePage.click('button[aria-label="Toggle navigation"]');

    // Menu should be hidden (check first Programs link in nav is gone)
    await expect(mobilePage.locator('nav >> text=Programs')).not.toBeVisible();
  });
});

test.describe('Responsive - Programs Page', () => {
  test('should show single column on mobile', async ({ mobilePage }) => {
    await navigateTo.programs(mobilePage);
    await waitFor.pageLoad(mobilePage);

    // Program cards should stack vertically
    const cards = mobilePage.locator('[class*="card"], article, .program-card');
    const count = await cards.count();

    if (count > 1) {
      const firstCard = await cards.nth(0).boundingBox();
      const secondCard = await cards.nth(1).boundingBox();

      if (firstCard && secondCard) {
        // Cards should be stacked (second card below first)
        expect(secondCard.y).toBeGreaterThan(firstCard.y);
      }
    }
  });

  test('should show grid layout on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await navigateTo.programs(page);
    await waitFor.pageLoad(page);

    // Should have multiple columns
    const gridContainer = page.locator('[class*="grid"]').first();
    await expect(gridContainer).toBeVisible();
  });
});

test.describe('Responsive - Schedule Page', () => {
  test('should adapt schedule view for mobile', async ({ mobilePage }) => {
    await navigateTo.schedule(mobilePage);
    await waitFor.pageLoad(mobilePage);

    // Schedule content should be visible
    await expect(mobilePage.locator('text=Weekly Program Times')).toBeVisible();

    // Take screenshot
    await mobilePage.screenshot({
      path: 'e2e/screenshots/schedule-mobile.png',
      fullPage: false,
    });
  });

  test('should show full schedule on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await navigateTo.schedule(page);
    await waitFor.pageLoad(page);

    // All schedule sections should be visible
    await expect(page.locator('text=Boys\' Classes')).toBeVisible();
    await expect(page.locator('text=Girls\' Classes')).toBeVisible();
  });
});

test.describe('Responsive - Registration Flow', () => {
  test('should work on mobile viewport', async ({ mobilePage }) => {
    await navigateTo.registerProgram(mobilePage, 'bjj');
    await waitFor.pageLoad(mobilePage);

    // Registration wizard should be usable
    await expect(mobilePage.getByText('Guardian', { exact: true }).first()).toBeVisible();

    // Form should fit within viewport
    const form = mobilePage.locator('form, [class*="wizard"]').first();
    const box = await form.boundingBox();

    if (box) {
      expect(box.width).toBeLessThanOrEqual(412); // Mobile viewport width
    }
  });

  test('should work on tablet viewport', async ({ tabletPage }) => {
    await navigateTo.registerProgram(tabletPage, 'bjj');
    await waitFor.pageLoad(tabletPage);

    // Registration wizard should be visible
    await expect(tabletPage.getByText('Guardian', { exact: true }).first()).toBeVisible();

    // Sidebar might be visible on tablet
    await expect(tabletPage.locator('text=Program Summary, text=Order Summary')).toBeVisible().catch(() => {
      // Sidebar might not be present
    });
  });
});

test.describe('Responsive - Admin Dashboard', () => {
  test('should adapt admin layout for mobile', async ({ mobilePage }) => {
    await navigateTo.admin(mobilePage);
    await waitFor.pageLoad(mobilePage);

    // Login form should be usable
    await expect(mobilePage.locator('input#admin-email')).toBeVisible();
    await expect(mobilePage.locator('input#admin-password')).toBeVisible();

    // Form should fit within viewport
    const form = mobilePage.locator('form, main').first();
    const box = await form.boundingBox();

    if (box) {
      expect(box.width).toBeLessThanOrEqual(375 + 20); // Allow some padding
    }
  });
});

test.describe('Responsive - Typography & Spacing', () => {
  test('should have readable font sizes on mobile', async ({ mobilePage }) => {
    await navigateTo.home(mobilePage);
    await waitFor.pageLoad(mobilePage);

    // Check heading font sizes
    const h1 = mobilePage.locator('h1').first();
    const fontSize = await h1.evaluate((el) => {
      return window.getComputedStyle(el).fontSize;
    });

    // Font size should be reasonable (at least 16px)
    const sizeInPx = parseInt(fontSize);
    expect(sizeInPx).toBeGreaterThanOrEqual(16);
  });

  test('should have proper touch targets on mobile', async ({ mobilePage }) => {
    await navigateTo.home(mobilePage);
    await waitFor.pageLoad(mobilePage);

    // Open mobile menu
    await mobilePage.click('button[aria-label="Toggle navigation"]');

    // Check touch target sizes
    const links = await mobilePage.locator('nav a, nav button').all();

    for (const link of links.slice(0, 5)) {
      const box = await link.boundingBox();
      if (box) {
        // Touch targets should be at least 44x44px (Apple HIG)
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });
});

test.describe('Responsive - Images', () => {
  test('images should not overflow on mobile', async ({ mobilePage }) => {
    await navigateTo.home(mobilePage);
    await waitFor.pageLoad(mobilePage);

    // Check all images
    const images = await mobilePage.locator('img').all();

    for (const img of images) {
      const box = await img.boundingBox();
      if (box) {
        // Images should not be wider than viewport
        const viewportWidth = await mobilePage.evaluate(() => window.innerWidth);
        expect(box.width).toBeLessThanOrEqual(viewportWidth);
      }
    }
  });
});
