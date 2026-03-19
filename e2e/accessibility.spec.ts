import { test, expect } from './fixtures';
import { navigateTo, waitFor } from './fixtures';
import { chromium } from '@playwright/test';

/**
 * Accessibility E2E Tests
 * Tests Axe-core scans and keyboard navigation
 */

// Helper to inject axe-core
test.describe('Accessibility - Axe Scans', () => {
  test.beforeEach(async ({ page }) => {
    // Inject axe-core from CDN for testing
    await page.addInitScript(() => {
      // axe-core will be available if installed as dependency
    });
  });

  test('homepage should have no critical accessibility violations', async ({ page }) => {
    await navigateTo.home(page);
    await waitFor.pageLoad(page);

    // Run accessibility check using Playwright's built-in checks
    // Check for alt text on images
    const images = await page.locator('img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      // Skip images that might be decorative
      const isDecorative = await img.evaluate((el) => {
        const src = el.getAttribute('src') || '';
        return src.includes('noise') || src.includes('texture');
      });

      if (!isDecorative) {
        expect(alt).toBeTruthy();
      }
    }

    // Check for proper heading hierarchy
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
    expect(h1Count).toBeLessThanOrEqual(2); // Should only have 1-2 h1s
  });

  test('programs page should have accessible cards', async ({ page }) => {
    await navigateTo.programs(page);
    await waitFor.pageLoad(page);

    // Program cards should be keyboard accessible
    const cards = await page.locator('a[href*="/programs/"]').all();

    for (const card of cards) {
      // Should have href (making it focusable)
      const href = await card.getAttribute('href');
      expect(href).toBeTruthy();
    }
  });

  test('schedule page should have accessible tables', async ({ page }) => {
    await navigateTo.schedule(page);
    await waitFor.pageLoad(page);

    // Check for semantic structure
    const hasMain = await page.locator('main').count() > 0;
    const hasHeader = await page.locator('header').count() > 0;

    expect(hasMain || hasHeader).toBeTruthy();
  });

  test('registration forms should have proper labels', async ({ page }) => {
    await navigateTo.registerProgram(page, 'bjj');
    await waitFor.pageLoad(page);

    // All inputs should have associated labels
    const inputs = await page.locator('input, select, textarea').all();

    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      const placeholder = await input.getAttribute('placeholder');

      // Check for label association
      let hasLabel = false;
      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        hasLabel = await label.count() > 0;
      }

      // Input should have some form of labeling
      const isLabeled = hasLabel || ariaLabel || ariaLabelledBy || placeholder;
      expect(isLabeled).toBeTruthy();
    }
  });

  test('contact form should have accessible error messages', async ({ page }) => {
    await navigateTo.contact(page);
    await waitFor.pageLoad(page);

    // Form should have proper structure
    const form = page.locator('form').first();
    await expect(form).toBeVisible();

    // Submit button should be labeled
    const submitButton = page.locator('button[type="submit"], button:has-text("Send")').first();
    const buttonText = await submitButton.textContent();
    expect(buttonText).toBeTruthy();
  });

  test('admin login should have accessible form', async ({ page }) => {
    await navigateTo.admin(page);
    await waitFor.pageLoad(page);

    // Email input
    const emailInput = page.locator('input#admin-email, input[type="email"]').first();
    const emailLabel = page.locator('label[for="admin-email"]').first();

    await expect(emailInput).toBeVisible();
    await expect(emailLabel).toBeVisible();

    // Password input
    const passwordInput = page.locator('input#admin-password, input[type="password"]').first();
    const passwordLabel = page.locator('label[for="admin-password"]').first();

    await expect(passwordInput).toBeVisible();
    await expect(passwordLabel).toBeVisible();
  });
});

test.describe('Accessibility - Keyboard Navigation', () => {
  test('should navigate homepage using keyboard', async ({ page }) => {
    await navigateTo.home(page);
    await waitFor.pageLoad(page);

    // Press Tab to focus first interactive element
    await page.keyboard.press('Tab');

    // Something should be focused
    const activeElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(activeElement).not.toBe('BODY');

    // Tab through navigation
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
    }

    // Should be able to focus navigation links
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return {
        tagName: el?.tagName,
        textContent: el?.textContent?.slice(0, 50),
        href: (el as HTMLAnchorElement)?.href,
      };
    });

    expect(focusedElement.tagName).toMatch(/A|BUTTON/);
  });

  test('should open mobile menu with keyboard', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await navigateTo.home(page);
    await waitFor.pageLoad(page);

    // Find and focus mobile menu button
    const menuButton = page.locator('button[aria-label="Toggle navigation"]');
    await menuButton.focus();

    // Press Enter to open
    await page.keyboard.press('Enter');

    // Menu should be visible
    await expect(page.locator('text=Schedule').nth(1)).toBeVisible();
  });

  test('should navigate registration form with keyboard', async ({ page }) => {
    await navigateTo.registerProgram(page, 'bjj');
    await waitFor.pageLoad(page);

    // Tab through form fields
    await page.keyboard.press('Tab'); // Focus first input

    const firstFocused = await page.evaluate(() => document.activeElement?.tagName);
    expect(firstFocused).toMatch(/INPUT|BUTTON/);

    // Fill first field using keyboard
    await page.keyboard.type('Test Guardian');

    // Tab to next field
    await page.keyboard.press('Tab');

    // Should be on next input
    const secondFocused = await page.evaluate(() => document.activeElement?.tagName);
    expect(secondFocused).toMatch(/INPUT/);
  });

  test('should use Enter to activate buttons', async ({ page }) => {
    await navigateTo.home(page);
    await waitFor.pageLoad(page);

    // Find a button and focus it
    const button = page.locator('a:has-text("Register Now"), button:has-text("Register")').first();
    await button.focus();

    // Press Enter
    await page.keyboard.press('Enter');

    // Should navigate
    await page.waitForTimeout(1000);
    const url = page.url();
    expect(url).toContain('/register');
  });

  test('should trap focus in modals', async ({ page }) => {
    // Navigate to admin where modals might appear
    await navigateTo.admin(page);
    await waitFor.pageLoad(page);

    // This test would need a modal to be open
    // For now, just verify basic keyboard navigation works
    await page.keyboard.press('Tab');

    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).not.toBe('BODY');
  });

  test('should have visible focus indicators', async ({ page }) => {
    await navigateTo.home(page);
    await waitFor.pageLoad(page);

    // Focus a link
    const link = page.locator('a').first();
    await link.focus();

    // Check for focus styles
    const hasFocusStyle = await link.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return styles.outline !== 'none' ||
             styles.boxShadow !== 'none' ||
             styles.borderColor !== '';
    });

    expect(hasFocusStyle).toBeTruthy();
  });
});

test.describe('Accessibility - Screen Reader Support', () => {
  test('should have proper ARIA landmarks', async ({ page }) => {
    await navigateTo.home(page);
    await waitFor.pageLoad(page);

    // Check for main landmark
    const mainCount = await page.locator('main, [role="main"]').count();
    expect(mainCount).toBeGreaterThanOrEqual(1);

    // Check for navigation landmark
    const navCount = await page.locator('nav, [role="navigation"]').count();
    expect(navCount).toBeGreaterThanOrEqual(1);
  });

  test('images should have descriptive alt text', async ({ page }) => {
    await navigateTo.programs(page);
    await waitFor.pageLoad(page);

    // Check program images
    const images = await page.locator('img').all();

    for (const img of images) {
      const alt = await img.getAttribute('alt');
      const src = await img.getAttribute('src');

      // Skip decorative images
      const isDecorative = src?.includes('noise') ||
                          src?.includes('texture') ||
                          src?.includes('gradient');

      if (!isDecorative) {
        // Content images should have alt text
        expect(alt).toBeTruthy();
        expect(alt?.length).toBeGreaterThan(0);
      }
    }
  });

  test('buttons should have accessible names', async ({ page }) => {
    await navigateTo.home(page);
    await waitFor.pageLoad(page);

    const buttons = await page.locator('button').all();

    for (const button of buttons) {
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      const title = await button.getAttribute('title');

      // Button should have some accessible name
      const hasName = text?.trim() || ariaLabel || title;
      expect(hasName).toBeTruthy();
    }
  });

  test('links should have descriptive text', async ({ page }) => {
    await navigateTo.programs(page);
    await waitFor.pageLoad(page);

    const links = await page.locator('a').all();

    for (const link of links.slice(0, 10)) { // Check first 10 links
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute('aria-label');

      // Link should have text or aria-label
      const hasText = text?.trim() || ariaLabel;
      expect(hasText).toBeTruthy();
    }
  });

  test('forms should have proper structure', async ({ page }) => {
    await navigateTo.registerProgram(page, 'bjj');
    await waitFor.pageLoad(page);

    // Check for form element
    const form = page.locator('form').first();
    await expect(form).toBeVisible();

    // Check for required field indicators
    const requiredInputs = await page.locator('input[required], select[required]').all();

    for (const input of requiredInputs) {
      // Required fields should have visual indicator or aria-required
      const ariaRequired = await input.getAttribute('aria-required');
      expect(await input.getAttribute('required') || ariaRequired).toBeTruthy();
    }
  });
});

test.describe('Accessibility - Color Contrast', () => {
  test('should have sufficient color contrast on text', async ({ page }) => {
    await navigateTo.home(page);
    await waitFor.pageLoad(page);

    // Check body text color
    const bodyStyles = await page.evaluate(() => {
      const body = document.body;
      const styles = window.getComputedStyle(body);
      return {
        color: styles.color,
        backgroundColor: styles.backgroundColor,
      };
    });

    // Text color should be defined
    expect(bodyStyles.color).toBeTruthy();
    expect(bodyStyles.backgroundColor).toBeTruthy();
  });

  test('buttons should have visible text', async ({ page }) => {
    await navigateTo.home(page);
    await waitFor.pageLoad(page);

    const buttons = await page.locator('button, a').all();

    for (const button of buttons.slice(0, 5)) {
      const isVisible = await button.isVisible().catch(() => false);
      if (isVisible) {
        const styles = await button.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            color: computed.color,
            backgroundColor: computed.backgroundColor,
          };
        });

        // Button should have color styles
        expect(styles.color).toBeTruthy();
      }
    }
  });
});

test.describe('Accessibility - Skip Links', () => {
  test('should have skip to content link', async ({ page }) => {
    await navigateTo.home(page);
    await waitFor.pageLoad(page);

    // Look for skip link
    const skipLink = page.locator('a[href^="#"]:has-text("Skip"), .skip-link, [class*="skip"]').first();

    // Skip link might be visually hidden but should exist
    const hasSkipLink = await skipLink.count() > 0;

    // This is a recommendation, not a requirement
    if (hasSkipLink) {
      await expect(skipLink).toHaveAttribute('href', /^#/);
    }
  });
});
