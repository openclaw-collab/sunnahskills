import { test, expect } from './fixtures';
import { navigateTo, waitFor } from './fixtures';

test.describe('Visual regression', () => {
  test.describe('Unauthenticated surfaces', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('registration hub is stable on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 1200 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await navigateTo.register(page);
      await waitFor.pageLoad(page);

      const hub = page.getByTestId('registration-hub');
      await hub.scrollIntoViewIfNeeded();
      await expect(hub).toHaveScreenshot('registration-hub-desktop.png');
    });

    test('registration hub is stable on mobile', async ({ mobilePage }) => {
      await mobilePage.emulateMedia({ reducedMotion: 'reduce' });
      await navigateTo.register(mobilePage);
      await waitFor.pageLoad(mobilePage);

      const hub = mobilePage.getByTestId('registration-hub');
      await hub.scrollIntoViewIfNeeded();
      await expect(hub).toHaveScreenshot('registration-hub-mobile.png');
    });

    test('bjj registration sign-in gate is stable', async ({ page }) => {
      await page.setViewportSize({ width: 1365, height: 1100 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await navigateTo.registerProgram(page, 'bjj');
      await waitFor.pageLoad(page);

      const gate = page.getByText('Sign in before you register').locator('..').locator('..');
      await gate.scrollIntoViewIfNeeded();
      await expect(gate).toHaveScreenshot('registration-bjj-signin-gate-desktop.png');
    });

    test('cart sign-in gate is stable', async ({ page }) => {
      await page.setViewportSize({ width: 1365, height: 1100 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/registration/cart');
      await waitFor.pageLoad(page);

      const gate = page.getByText('Sign in to finish checkout').locator('..').locator('..');
      await gate.scrollIntoViewIfNeeded();
      await expect(gate).toHaveScreenshot('registration-cart-signin-desktop.png');
    });

    test('registration success state is stable', async ({ page }) => {
      await page.setViewportSize({ width: 1365, height: 1000 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/registration/success?rid=123');
      await waitFor.pageLoad(page);

      await expect(page.locator('main')).toHaveScreenshot('registration-success-desktop.png');
    });

    test('registration waitlist state is stable', async ({ page }) => {
      await page.setViewportSize({ width: 1365, height: 1000 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/registration/waitlist?pos=3&program=BJJ');
      await waitFor.pageLoad(page);

      await expect(page.locator('main')).toHaveScreenshot('registration-waitlist-desktop.png');
    });

    test('admin login is stable on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 960 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await navigateTo.admin(page);
      await waitFor.pageLoad(page);

      const form = page.getByTestId('admin-login-form');
      await form.scrollIntoViewIfNeeded();
      await expect(form).toHaveScreenshot('admin-login-desktop.png');
    });

    test('admin login is stable on mobile', async ({ mobilePage }) => {
      await mobilePage.emulateMedia({ reducedMotion: 'reduce' });
      await navigateTo.admin(mobilePage);
      await waitFor.pageLoad(mobilePage);

      const form = mobilePage.getByTestId('admin-login-form');
      await form.scrollIntoViewIfNeeded();
      await expect(form).toHaveScreenshot('admin-login-mobile.png');
    });
  });

  test('homepage snapshot card is stable on mobile', async ({ mobilePage }) => {
    await mobilePage.emulateMedia({ reducedMotion: 'reduce' });
    await navigateTo.home(mobilePage);
    await waitFor.pageLoad(mobilePage);

    const snapshotCard = mobilePage.getByTestId('academy-snapshot-card');
    await snapshotCard.scrollIntoViewIfNeeded();
    await expect(snapshotCard).toHaveScreenshot('home-snapshot-mobile.png');
  });

  test('homepage snapshot and mini-schedule hold together on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1100 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await navigateTo.home(page);
    await waitFor.pageLoad(page);

    const overview = page.getByTestId('home-overview');
    await overview.scrollIntoViewIfNeeded();
    await expect(overview).toHaveScreenshot('home-overview-desktop.png', {
      mask: [page.locator('canvas').first()],
    });
  });

  test('enrollment cards stay balanced on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1100 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await navigateTo.home(page);
    await waitFor.pageLoad(page);

    const tracks = page.getByTestId('enrollment-tracks');
    await tracks.scrollIntoViewIfNeeded();
    await expect(tracks).toHaveScreenshot('home-enrollment-desktop.png');
  });

  test('program cards stay balanced on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1100 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await navigateTo.programs(page);
    await waitFor.pageLoad(page);

    const grid = page.getByTestId('programs-grid');
    await grid.scrollIntoViewIfNeeded();
    await expect(grid).toHaveScreenshot('programs-grid-desktop.png');
  });

  test('schedule week view keeps grouped concurrent classes legible', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1100 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await navigateTo.schedule(page);
    await waitFor.pageLoad(page);

    const weeklyView = page.getByTestId('schedule-weekly-view');
    await weeklyView.scrollIntoViewIfNeeded();
    await expect(weeklyView).toHaveScreenshot('schedule-weekly-view-desktop.png');
  });

  test.describe('Admin surfaces', () => {
    test('admin overview is stable', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 1200 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await navigateTo.adminDashboard(page);
      await waitFor.pageLoad(page);

      const panel = page.getByTestId('admin-overview-panel');
      await panel.scrollIntoViewIfNeeded();
      await expect(panel).toHaveScreenshot('admin-overview-desktop.png');
    });

    test('admin registrations panel is stable', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 1200 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await navigateTo.adminDashboard(page);
      await waitFor.pageLoad(page);
      await page.getByRole('tab', { name: 'Registrations' }).click();

      const panel = page.getByTestId('admin-registrations-panel');
      await panel.scrollIntoViewIfNeeded();
      await expect(panel).toHaveScreenshot('admin-registrations-desktop.png');
    });

    test('admin payments panel is stable', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 1200 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await navigateTo.adminDashboard(page);
      await waitFor.pageLoad(page);
      await page.getByRole('tab', { name: 'Payments' }).click();

      const panel = page.getByTestId('admin-payments-panel');
      await panel.scrollIntoViewIfNeeded();
      await expect(panel).toHaveScreenshot('admin-payments-desktop.png');
    });

    test('admin discounts panel is stable', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 1200 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await navigateTo.adminDashboard(page);
      await waitFor.pageLoad(page);
      await page.getByRole('tab', { name: 'Discounts' }).click();

      const panel = page.getByTestId('admin-discounts-panel');
      await panel.scrollIntoViewIfNeeded();
      await expect(panel).toHaveScreenshot('admin-discounts-desktop.png');
    });

    test('admin pricing panel is stable', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 1200 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await navigateTo.adminDashboard(page);
      await waitFor.pageLoad(page);
      await page.getByRole('tab', { name: 'Pricing' }).click();

      const panel = page.getByTestId('admin-pricing-panel');
      await panel.scrollIntoViewIfNeeded();
      await expect(panel).toHaveScreenshot('admin-pricing-desktop.png');
    });

    test('admin sessions panel is stable', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 1200 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await navigateTo.adminDashboard(page);
      await waitFor.pageLoad(page);
      await page.getByRole('tab', { name: 'Sessions' }).click();

      const panel = page.getByTestId('admin-sessions-panel');
      await panel.scrollIntoViewIfNeeded();
      await expect(panel).toHaveScreenshot('admin-sessions-desktop.png');
    });

    test('admin contacts panel is stable', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 1200 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await navigateTo.adminDashboard(page);
      await waitFor.pageLoad(page);
      await page.getByRole('tab', { name: 'Contacts' }).click();

      const panel = page.getByTestId('admin-contacts-panel');
      await panel.scrollIntoViewIfNeeded();
      await expect(panel).toHaveScreenshot('admin-contacts-desktop.png');
    });

    test('admin export panel is stable', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 1200 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await navigateTo.adminDashboard(page);
      await waitFor.pageLoad(page);
      await page.getByRole('tab', { name: 'Export' }).click();

      const panel = page.getByTestId('admin-export-panel');
      await panel.scrollIntoViewIfNeeded();
      await expect(panel).toHaveScreenshot('admin-export-desktop.png');
    });

    test('admin registration detail modal is stable', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 1200 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await navigateTo.adminDashboard(page);
      await waitFor.pageLoad(page);
      await page.getByRole('tab', { name: 'Registrations' }).click();
      await page.locator('table tbody tr').first().click();

      const dialog = page.getByTestId('admin-registration-detail-dialog');
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveScreenshot('admin-registration-detail-desktop.png');
    });
  });
});
