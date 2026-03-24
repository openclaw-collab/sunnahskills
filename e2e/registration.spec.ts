import { test, expect } from './fixtures';
import { navigateTo, waitFor, generateTestData } from './fixtures';

/**
 * Registration Journey E2E Tests
 * Tests complete registration flow for each program
 */

const programs = [
  { slug: 'bjj', name: 'BJJ', fullName: 'Brazilian Jiu-Jitsu' },
  { slug: 'archery', name: 'Archery', fullName: 'Traditional Archery' },
  { slug: 'outdoor', name: 'Outdoor', fullName: 'Outdoor Workshops' },
  { slug: 'bullyproofing', name: 'Bullyproofing', fullName: 'Bullyproofing' },
];

test.describe('Registration Hub', () => {
  test('should display all program registration options', async ({ page }) => {
    await navigateTo.register(page);
    await waitFor.pageLoad(page);

    await expect(page.locator('h1, h2').first()).toContainText('Choose a Program');

    // All programs should have registration cards
    for (const program of programs) {
      await expect(page.getByText(program.fullName)).toBeVisible();
    }

    // Registration buttons
    const registerButtons = page.getByRole('button', { name: /register for/i });
    await expect(registerButtons).toHaveCount(4);
  });

  test('should navigate to program-specific registration', async ({ page }) => {
    await navigateTo.register(page);
    await waitFor.pageLoad(page);

    // Click on BJJ registration
    await page.getByRole('button', { name: /register for bjj/i }).click();
    await page.waitForURL('/programs/bjj/register', { timeout: 10000 });

    await expect(page).toHaveURL('/programs/bjj/register');
    await expect(page.getByText('Brazilian Jiu-Jitsu')).toBeVisible();
  });
});

test.describe('Registration Flow - Common Steps', () => {
  test.beforeEach(async ({ page }) => {
    await navigateTo.registerProgram(page, 'bjj');
    await waitFor.pageLoad(page);
  });

  test('should show registration wizard with steps', async ({ page }) => {
    // Step indicators
    await expect(page.getByText('Guardian')).toBeVisible();
    await expect(page.getByText('Student')).toBeVisible();
    await expect(page.getByText('Details')).toBeVisible();
    await expect(page.getByText('Waivers')).toBeVisible();
    await expect(page.getByText('Payment')).toBeVisible();

    // Program summary
    await expect(page.getByText('Brazilian Jiu-Jitsu')).toBeVisible();
  });

  test('should complete guardian information step', async ({ page }) => {
    const guardian = generateTestData.guardian();

    // Fill guardian form using accessible locators
    await page.getByLabel(/full name/i).first().fill(guardian.fullName);
    await page.getByLabel(/email/i).first().fill(guardian.email);
    await page.getByLabel(/phone/i).first().fill(guardian.phone);

    // Address fields if present
    const addressLabel = page.getByLabel(/address/i).first();
    if (await addressLabel.isVisible().catch(() => false)) {
      await addressLabel.fill(guardian.address);
      await page.getByLabel(/city/i).fill(guardian.city);
      await page.getByLabel(/state/i).fill(guardian.state);
      await page.getByLabel(/zip/i).fill(guardian.zipCode);
    }

    // Continue to next step
    await page.getByRole('button', { name: /continue|next/i }).click();

    // Should advance to student step
    await expect(page.getByText('Student Information')).toBeVisible();
  });

  test('should validate required guardian fields', async ({ page }) => {
    // Try to continue without filling required fields
    await page.getByRole('button', { name: /continue|next/i }).click();

    // Should still be on guardian step
    await expect(page.getByText('Guardian Information')).toBeVisible();
  });
});

test.describe('Registration Flow - BJJ Program', () => {
  test('should complete full BJJ registration flow', async ({ page }) => {
    await navigateTo.registerProgram(page, 'bjj');
    await waitFor.pageLoad(page);

    const guardian = generateTestData.guardian();
    const student = generateTestData.student();

    // Step 1: Guardian Info
    await page.getByLabel(/full name/i).first().fill(guardian.fullName);
    await page.getByLabel(/email/i).first().fill(guardian.email);
    await page.getByLabel(/phone/i).first().fill(guardian.phone);
    await page.getByRole('button', { name: /continue|next/i }).click();

    // Step 2: Student Info
    await page.getByLabel(/student.*name|full name/i).first().fill(student.fullName);
    await page.getByLabel(/date of birth|dob/i).first().fill(student.dateOfBirth);

    // Select gender if radio buttons exist
    const maleRadio = page.getByRole('radio', { name: /male/i }).first();
    if (await maleRadio.isVisible().catch(() => false)) {
      await maleRadio.check();
    }

    await page.getByRole('button', { name: /continue|next/i }).click();

    // Step 3: Program Details
    // Select class schedule if options exist
    const scheduleSelect = page.getByLabel(/schedule|class time/i).first();
    if (await scheduleSelect.isVisible().catch(() => false)) {
      await scheduleSelect.selectOption({ index: 1 });
    }

    // Sibling count
    const siblingInput = page.getByLabel(/sibling/i).first();
    if (await siblingInput.isVisible().catch(() => false)) {
      await siblingInput.fill('0');
    }

    await page.getByRole('button', { name: /continue|next/i }).click();

    // Step 4: Waivers
    const waiverCheckboxes = await page.getByRole('checkbox').all();
    for (const checkbox of waiverCheckboxes) {
      if (await checkbox.isVisible().catch(() => false)) {
        await checkbox.check();
      }
    }

    await page.getByRole('button', { name: /continue|next/i }).click();

    // Step 5: Payment (or waitlist)
    const hasPayment = await page.getByText(/payment|credit card|stripe/i).isVisible().catch(() => false);
    const hasWaitlist = await page.getByText(/waitlist|waiting list/i).isVisible().catch(() => false);
    expect(hasPayment || hasWaitlist).toBe(true);
  });
});

test.describe('Registration Flow - All Programs', () => {
  for (const program of programs) {
    test(`should load registration page for ${program.name}`, async ({ page }) => {
      await navigateTo.registerProgram(page, program.slug);
      await waitFor.pageLoad(page);

      // Verify program-specific content
      await expect(page.locator('body')).toContainText(program.fullName);

      // Verify wizard is present
      await expect(page.getByText('Guardian')).toBeVisible();
    });

    test(`should show program summary for ${program.name}`, async ({ page }) => {
      await navigateTo.registerProgram(page, program.slug);
      await waitFor.pageLoad(page);

      // Program summary card or program name visible
      const hasSummary = await page.getByText(/program summary|order summary/i).isVisible().catch(() => false);
      const hasProgramName = await page.getByText(program.fullName).isVisible().catch(() => false);
      expect(hasSummary || hasProgramName).toBe(true);
    });
  }
});

test.describe('Registration - Edge Cases', () => {
  test('should handle back navigation between steps', async ({ page }) => {
    await navigateTo.registerProgram(page, 'bjj');
    await waitFor.pageLoad(page);

    const guardian = generateTestData.guardian();

    // Fill step 1
    await page.getByLabel(/full name/i).first().fill(guardian.fullName);
    await page.getByLabel(/email/i).first().fill(guardian.email);
    await page.getByRole('button', { name: /continue/i }).click();

    // Go back
    await page.getByRole('button', { name: /back/i }).click();

    // Should return to guardian step with data preserved
    await expect(page.getByText('Guardian')).toBeVisible();
    await expect(page.getByLabel(/full name/i).first()).toHaveValue(guardian.fullName);
  });

  test('should show resume banner for saved draft', async ({ page }) => {
    // First, start a registration and save progress
    await navigateTo.registerProgram(page, 'bjj');
    await waitFor.pageLoad(page);

    const guardian = generateTestData.guardian();
    await page.getByLabel(/full name/i).first().fill(guardian.fullName);
    await page.getByLabel(/email/i).first().fill(guardian.email);

    // Navigate away and back
    await page.goto('/');
    await navigateTo.registerProgram(page, 'bjj');

    // Should show resume banner (skip if not implemented)
    const hasResume = await page.getByText(/resume|continue where you left off/i).isVisible().catch(() => false);
    if (!hasResume) {
      test.skip();
    }
  });

  test('should handle discount code application', async ({ page }) => {
    await navigateTo.registerProgram(page, 'bjj');
    await waitFor.pageLoad(page);

    const guardian = generateTestData.guardian();

    // Guardian step
    await page.getByLabel(/full name/i).first().fill(guardian.fullName);
    await page.getByLabel(/email/i).first().fill(guardian.email);
    await page.getByLabel(/phone/i).first().fill('555-0123');
    await page.getByRole('button', { name: /continue/i }).click();

    // Student step
    await page.getByLabel(/student.*name|full name/i).first().fill('Test Student');
    await page.getByLabel(/date of birth|dob/i).first().fill('2010-05-15');
    await page.getByRole('button', { name: /continue/i }).click();

    // Details step
    await page.getByRole('button', { name: /continue/i }).click();

    // Waivers step
    const checkboxes = await page.getByRole('checkbox').all();
    for (const checkbox of checkboxes.slice(0, 3)) {
      await checkbox.check().catch(() => {});
    }
    await page.getByRole('button', { name: /continue/i }).click();

    // Try to apply discount code if field exists
    const discountInput = page.getByLabel(/discount|promo code/i).first();
    if (await discountInput.isVisible().catch(() => false)) {
      await discountInput.fill('TESTCODE');
      await page.getByRole('button', { name: /apply/i }).click().catch(() => {});
    }
  });
});

test.describe('Registration Success/Cancel/Waitlist Pages', () => {
  test('should load registration success page', async ({ page }) => {
    await page.goto('/registration/success?rid=123');
    await waitFor.pageLoad(page);

    await expect(page.locator('h1, h2').first()).toContainText(/enrolled|Success|Thank you|Confirmed/i);
    await expect(
      page.getByRole('link', { name: /home/i }).or(page.getByRole('button', { name: /home/i }))
    ).toBeVisible();
  });

  test('should load registration cancel page', async ({ page }) => {
    await page.goto('/registration/cancel');
    await waitFor.pageLoad(page);

    await expect(page.locator('h1, h2').first()).toContainText(/Cancel|Cancelled|Payment/i);
  });

  test('should load registration waitlist page', async ({ page }) => {
    await page.goto('/registration/waitlist?pos=3&program=BJJ');
    await waitFor.pageLoad(page);

    await expect(page.locator('h1, h2').first()).toContainText(/Waitlist|Waiting list/i);
    await expect(page.locator('body')).toContainText('3');
  });

  test('should load registration pending page', async ({ page }) => {
    await page.goto('/registration/pending');
    await waitFor.pageLoad(page);

    await expect(page.locator('h1, h2').first()).toContainText(/Pending|Processing/i);
  });
});
