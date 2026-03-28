import { test, expect } from './fixtures';
import { navigateTo, waitFor } from './fixtures';

test.describe('Visual regression', () => {
  test('homepage snapshot card is stable on mobile', async ({ mobilePage }) => {
    await mobilePage.emulateMedia({ reducedMotion: 'reduce' });
    await navigateTo.home(mobilePage);
    await waitFor.pageLoad(mobilePage);

    await mobilePage.getByTestId('academy-explorer-trigger-snapshot').click();
    const snapshotCard = mobilePage.getByTestId('academy-snapshot-card');
    await snapshotCard.scrollIntoViewIfNeeded();
    await expect(snapshotCard).toHaveScreenshot('home-snapshot-mobile.png');
  });

  test('homepage academy explorer holds together on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1100 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await navigateTo.home(page);
    await waitFor.pageLoad(page);

    const explorer = page.getByTestId('home-academy-explorer');
    await explorer.scrollIntoViewIfNeeded();
    await expect(explorer).toHaveScreenshot('home-overview-desktop.png', {
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
});
