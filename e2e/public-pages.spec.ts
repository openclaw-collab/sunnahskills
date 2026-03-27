import { test, expect } from './fixtures';
import { navigateTo, waitFor } from './fixtures';

test.describe('Public pages', () => {
  test('homepage loads current sections and actions', async ({ page }) => {
    await navigateTo.home(page);
    await waitFor.pageLoad(page);

    await expect(page.getByRole('heading', { level: 1 })).toContainText('Built Through');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Discipline.');
    await expect(page.getByRole('link', { name: /register now/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /open your account/i })).toBeVisible();
    await expect(page.getByText('This Week at Sunnah Skills')).toBeVisible();
    await expect(page.getByText('Academy Snapshot')).toBeVisible();
    await expect(page.getByText('Weekly Schedule')).toBeVisible();
    await expect(page.getByText('Core Curriculum')).toBeVisible();
    await expect(page.getByText('Enrollment Tracks')).toBeVisible();
    await expect(page.getByText('What Parents Say')).toBeVisible();
  });

  test('desktop navigation opens the programs menu and routes correctly', async ({ page }) => {
    await navigateTo.home(page);
    await waitFor.pageLoad(page);

    await page.setViewportSize({ width: 1440, height: 1100 });
    await page.getByRole('button', { name: 'Programs' }).hover();
    const nav = page.getByRole('navigation');

    await expect(page.getByText('Browse programs')).toBeVisible();
    await expect(nav.getByRole('link', { name: 'All Programs', exact: true })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Brazilian Jiu-Jitsu', exact: true })).toBeVisible();

    await nav.getByRole('link', { name: 'Schedule', exact: true }).click();
    await page.waitForURL('**/schedule');
    await expect(page.getByRole('heading', { name: 'Weekly class schedule' })).toBeVisible();
  });

  test('mobile navigation opens and routes correctly', async ({ mobilePage }) => {
    await navigateTo.home(mobilePage);
    await waitFor.pageLoad(mobilePage);

    await mobilePage.getByRole('button', { name: /toggle navigation/i }).click();
    const nav = mobilePage.getByRole('navigation');
    await expect(nav.getByRole('link', { name: 'All programs', exact: true })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'About', exact: true })).toBeVisible();

    await nav.getByRole('link', { name: 'Contact', exact: true }).click();
    await mobilePage.waitForURL('**/contact');
    await expect(mobilePage.getByRole('heading', { name: 'Get in Touch' })).toBeVisible();
  });

  test('programs page shows current cards and actions', async ({ page }) => {
    await navigateTo.programs(page);
    await waitFor.pageLoad(page);

    await expect(page.getByRole('heading', { name: 'Choose the Right Fit' })).toBeVisible();
    await expect(page.getByText('Brazilian Jiu-Jitsu').first()).toBeVisible();
    await expect(page.getByText('Traditional Archery').first()).toBeVisible();
    await expect(page.getByText('Outdoor Workshops').first()).toBeVisible();
    await expect(page.getByText('Bullyproofing Workshops').first()).toBeVisible();
    await expect(page.getByRole('link', { name: /open your family & member account/i })).toBeVisible();
  });

  test('schedule page toggles between week and month views', async ({ page }) => {
    await navigateTo.schedule(page);
    await waitFor.pageLoad(page);

    await expect(page.getByRole('heading', { name: 'Weekly class schedule' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Week', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Month', exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Month', exact: true }).click();
    await expect(page.getByRole('button', { name: 'This month', exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Week', exact: true }).click();
    await expect(page.getByText('Time grid · scroll horizontally on small screens')).toBeVisible();
  });

  test('about, contact, and registration hub load current headings', async ({ page }) => {
    await navigateTo.about(page);
    await waitFor.pageLoad(page);
    await expect(page.getByRole('heading', { name: 'The Sunnah Skills Philosophy' })).toBeVisible();

    await navigateTo.contact(page);
    await waitFor.pageLoad(page);
    await expect(page.getByRole('heading', { name: 'Get in Touch' })).toBeVisible();

    await page.goto('/register');
    await waitFor.pageLoad(page);
    await expect(page.getByRole('heading', { name: 'Open your account before you register' })).toBeVisible();
  });
});
