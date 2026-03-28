import { test, expect } from './fixtures';
import { navigateTo, waitFor } from './fixtures';

const routes = [
  { name: 'home', goto: navigateTo.home },
  { name: 'programs', goto: navigateTo.programs },
  { name: 'schedule', goto: navigateTo.schedule },
  { name: 'about', goto: navigateTo.about },
  { name: 'contact', goto: navigateTo.contact },
  { name: 'register', goto: async (page: Parameters<typeof navigateTo.home>[0]) => page.goto('/register') },
];

async function expectNoHorizontalOverflow(page: Parameters<typeof navigateTo.home>[0]) {
  const overflow = await page.evaluate(() => {
    const root = document.documentElement;
    return {
      scrollWidth: Math.max(root.scrollWidth, document.body.scrollWidth),
      innerWidth: window.innerWidth,
    };
  });

  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.innerWidth + 1);
}

test.describe('Responsive layout sweep', () => {
  for (const viewport of [
    { name: 'mobile', width: 390, height: 844 },
    { name: 'tablet', width: 834, height: 1194 },
    { name: 'desktop', width: 1440, height: 1100 },
  ]) {
    test(`public routes stay inside the viewport on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      for (const route of routes) {
        await route.goto(page);
        await waitFor.pageLoad(page);
        await expectNoHorizontalOverflow(page);
      }
    });
  }
});

test.describe('Responsive hotspots', () => {
  test('homepage snapshot section remains usable on mobile', async ({ mobilePage }) => {
    await navigateTo.home(mobilePage);
    await waitFor.pageLoad(mobilePage);

    await mobilePage.getByTestId('academy-explorer-trigger-snapshot').click();
    const snapshotCard = mobilePage.getByTestId('academy-snapshot-card');
    await snapshotCard.scrollIntoViewIfNeeded();
    await expect(snapshotCard).toBeVisible();
    await expectNoHorizontalOverflow(mobilePage);

    const buttons = snapshotCard.getByRole('button');
    await expect(buttons).toHaveCount(8);
  });

  test('homepage enrollment cards remain balanced on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1100 });
    await navigateTo.home(page);
    await waitFor.pageLoad(page);

    const tracks = page.getByTestId('enrollment-tracks');
    await tracks.scrollIntoViewIfNeeded();
    await expect(tracks).toBeVisible();

    const first = await page.getByTestId('enrollment-card-girls').boundingBox();
    const second = await page.getByTestId('enrollment-card-boys').boundingBox();
    expect(first?.y).toBe(second?.y);
  });

  test('programs grid stacks cleanly on mobile and opens two-up on desktop', async ({ mobilePage, page }) => {
    await navigateTo.programs(mobilePage);
    await waitFor.pageLoad(mobilePage);

    const mobileGrid = mobilePage.getByTestId('programs-grid');
    await mobileGrid.scrollIntoViewIfNeeded();
    const mobileFirst = await mobilePage.getByTestId('program-card-bjj').boundingBox();
    const mobileSecond = await mobilePage.getByTestId('program-card-archery').boundingBox();
    expect(mobileSecond?.y).toBeGreaterThan(mobileFirst?.y ?? 0);

    await page.setViewportSize({ width: 1440, height: 1100 });
    await navigateTo.programs(page);
    await waitFor.pageLoad(page);

    const desktopFirst = await page.getByTestId('program-card-bjj').boundingBox();
    const desktopSecond = await page.getByTestId('program-card-archery').boundingBox();
    expect(Math.abs((desktopSecond?.y ?? 0) - (desktopFirst?.y ?? 0))).toBeLessThan(20);
  });

  test('mobile navigation links maintain touch target sizing', async ({ mobilePage }) => {
    await navigateTo.home(mobilePage);
    await waitFor.pageLoad(mobilePage);
    await mobilePage.getByRole('button', { name: /toggle navigation/i }).click();

    const links = await mobilePage.locator('nav div.absolute a, nav div.absolute button').all();
    for (const link of links.slice(0, 6)) {
      const box = await link.boundingBox();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });
});
