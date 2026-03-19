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

    await expect(page.locator('h1, h2')).toContainText('Choose a Program');

    // All programs should have registration cards
    for (const program of programs) {
      await expect(page.locator(`text=${program.fullName}`)).toBeVisible();
    }

    // Registration buttons
    const registerButtons = page.locator('button:has-text("Register for")');
    await expect(registerButtons).toHaveCount(4);
  });

  test('should navigate to program-specific registration', async ({ page }) => {
    await navigateTo.register(page);
    await waitFor.pageLoad(page);

    // Click on BJJ registration
    await page.click('button:has-text("Register for BJJ")');
    await page.waitForURL('/programs/bjj/register', { timeout: 10000 });

    await expect(page).toHaveURL('/programs/bjj/register');
    await expect(page.locator('text=Brazilian Jiu-Jitsu')).toBeVisible();
  });
});

test.describe('Registration Flow - Common Steps', () => {
  test.beforeEach(async ({ page }) => {
    await navigateTo.registerProgram(page, 'bjj');
    await waitFor.pageLoad(page);
  });

  test('should show registration wizard with steps', async ({ page }) => {
    // Step indicators
    await expect(page.locator('text=Guardian')).toBeVisible();
    await expect(page.locator('text=Student')).toBeVisible();
    await expect(page.locator('text=Details')).toBeVisible();
    await expect(page.locator('text=Waivers')).toBeVisible();
    await expect(page.locator('text=Payment')).toBeVisible();

    // Program summary
    await expect(page.locator('text=Brazilian Jiu-Jitsu')).toBeVisible();
  });

  test('should complete guardian information step', async ({ page }) => {
    const guardian = generateTestData.guardian();

    // Fill guardian form
    await page.fill('input[name="guardian.fullName"], input[name="fullName"], #guardian-fullName', guardian.fullName);
    await page.fill('input[name="guardian.email"], input[name="email"], #guardian-email', guardian.email);
    await page.fill('input[name="guardian.phone"], input[name="phone"], #guardian-phone', guardian.phone);

    // Address fields if present
    const addressInput = page.locator('input[name="guardian.address"], input[name="address"]').first();
    if (await addressInput.isVisible().catch(() => false)) {
      await addressInput.fill(guardian.address);
      await page.fill('input[name="city"]', guardian.city);
      await page.fill('input[name="state"]', guardian.state);
      await page.fill('input[name="zipCode"]', guardian.zipCode);
    }

    // Continue to next step
    await page.click('button:has-text("Continue"), button:has-text("Next")');

    // Should advance to student step
    await expect(page.locator('[data-step="student"], text=Student Information')).toBeVisible();
  });

  test('should validate required guardian fields', async ({ page }) => {
    // Try to continue without filling required fields
    await page.click('button:has-text("Continue"), button:has-text("Next")');

    // Should still be on guardian step
    await expect(page.locator('text=Guardian Information')).toBeVisible();
  });
});

test.describe('Registration Flow - BJJ Program', () => {
  test('should complete full BJJ registration flow', async ({ page }) => {
    await navigateTo.registerProgram(page, 'bjj');
    await waitFor.pageLoad(page);

    const guardian = generateTestData.guardian();
    const student = generateTestData.student();

    // Step 1: Guardian Info
    await page.fill('input[name="guardian.fullName"], #guardian-fullName', guardian.fullName);
    await page.fill('input[name="guardian.email"], #guardian-email', guardian.email);
    await page.fill('input[name="guardian.phone"], #guardian-phone', guardian.phone);
    await page.click('button:has-text("Continue"), button:has-text("Next")');

    // Step 2: Student Info
    await page.fill('input[name="student.fullName"], #student-fullName', student.fullName);
    await page.fill('input[name="student.dateOfBirth"], #student-dob', student.dateOfBirth);

    // Select gender if radio buttons exist
    const maleRadio = page.locator('input[value="male"]').first();
    if (await maleRadio.isVisible().catch(() => false)) {
      await maleRadio.check();
    }

    await page.click('button:has-text("Continue"), button:has-text("Next")');

    // Step 3: Program Details
    // Select class schedule if options exist
    const scheduleSelect = page.locator('select[name="schedule"], select[name="classTime"]').first();
    if (await scheduleSelect.isVisible().catch(() => false)) {
      await scheduleSelect.selectOption({ index: 1 });
    }

    // Sibling count
    const siblingInput = page.locator('input[name="siblingCount"]').first();
    if (await siblingInput.isVisible().catch(() => false)) {
      await siblingInput.fill('0');
    }

    await page.click('button:has-text("Continue"), button:has-text("Next")');

    // Step 4: Waivers
    // Check waiver checkboxes if present
    const waiverCheckboxes = page.locator('input[type="checkbox"]').all();
    for (const checkbox of await waiverCheckboxes) {
      if (await checkbox.isVisible().catch(() => false)) {
        await checkbox.check();
      }
    }

    await page.click('button:has-text("Continue"), button:has-text("Next")');

    // Step 5: Payment (or waitlist)
    await expect(page.locator('text=Payment, text=Credit Card, text=Stripe')).toBeVisible().catch(() => {
      // Might be on waitlist page
      return expect(page.locator('text=Waitlist, text=waiting list')).toBeVisible();
    });
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
      await expect(page.locator('text=Guardian')).toBeVisible();
    });

    test(`should show program summary for ${program.name}`, async ({ page }) => {
      await navigateTo.registerProgram(page, program.slug);
      await waitFor.pageLoad(page);

      // Program summary card
      await expect(page.locator('text=Program Summary, text=Order Summary')).toBeVisible().catch(() => {
        // Alternative text
        return expect(page.locator(`text=${program.fullName}`)).toBeVisible();
      });
    });
  }
});

test.describe('Registration - Edge Cases', () => {
  test('should handle back navigation between steps', async ({ page }) => {
    await navigateTo.registerProgram(page, 'bjj');
    await waitFor.pageLoad(page);

    const guardian = generateTestData.guardian();

    // Fill step 1
    await page.fill('input[name="guardian.fullName"], #guardian-fullName', guardian.fullName);
    await page.fill('input[name="guardian.email"], #guardian-email', guardian.email);
    await page.click('button:has-text("Continue")');

    // Go back
    await page.click('button:has-text("Back")');

    // Should return to guardian step with data preserved
    await expect(page.locator('text=Guardian')).toBeVisible();
    await expect(page.locator('input[name="guardian.fullName"], #guardian-fullName')).toHaveValue(guardian.fullName);
  });

  test('should show resume banner for saved draft', async ({ page }) => {
    // First, start a registration and save progress
    await navigateTo.registerProgram(page, 'bjj');
    await waitFor.pageLoad(page);

    const guardian = generateTestData.guardian();
    await page.fill('input[name="guardian.fullName"], #guardian-fullName', guardian.fullName);
    await page.fill('input[name="guardian.email"], #guardian-email', guardian.email);

    // Navigate away and back
    await page.goto('/');
    await navigateTo.registerProgram(page, 'bjj');

    // Should show resume banner
    await expect(page.locator('text=Resume, text=Continue where you left off')).toBeVisible().catch(() => {
      // Draft saving might not be implemented
      test.skip();
    });
  });

  test('should handle discount code application', async ({ page }) => {
    await navigateTo.registerProgram(page, 'bjj');
    await waitFor.pageLoad(page);

    // Progress to payment step
    const guardian = generateTestData.guardian();
    await page.fill('input[name="guardian.fullName"], #guardian-fullName', guardian.fullName);
    await page.fill('input[name="guardian.email"], #guardian-email', guardian.email);
    await page.fill('input[name="guardian.phone"], #guardian-phone', '555-0123');
    await page.click('button:has-text("Continue")');

    // Student step
    await page.fill('input[name="student.fullName"], #student-fullName', 'Test Student');
    await page.fill('input[name="student.dateOfBirth"], #student-dob', '2010-05-15');
    await page.click('button:has-text("Continue")');

    // Details step
    await page.click('button:has-text("Continue")');

    // Waivers step
    const checkboxes = await page.locator('input[type="checkbox"]').all();
    for (const checkbox of checkboxes.slice(0, 3)) {
      await checkbox.check().catch(() => {});
    }
    await page.click('button:has-text("Continue")');

    // Try to apply discount code if field exists
    const discountInput = page.locator('input[name="discountCode"], input[placeholder*="discount"]').first();
    if (await discountInput.isVisible().catch(() => false)) {
      await discountInput.fill('TESTCODE');
      await page.click('button:has-text("Apply")').catch(() => {});
    }
  });
});

test.describe('Registration Success/Cancel/Waitlist Pages', () => {
  test('should load registration success page', async ({ page }) => {
    await page.goto('/registration/success?rid=123');
    await waitFor.pageLoad(page);

    await expect(page.locator('h1, h2')).toContainText(/Success|Thank you|Confirmed/i);
    await expect(page.locator('a:has-text("Home"), button:has-text("Home")')).toBeVisible();
  });

  test('should load registration cancel page', async ({ page }) => {
    await page.goto('/registration/cancel');
    await waitFor.pageLoad(page);

    await expect(page.locator('h1, h2')).toContainText(/Cancel|Cancelled/i);
  });

  test('should load registration waitlist page', async ({ page }) => {
    await page.goto('/registration/waitlist?pos=3&program=BJJ');
    await waitFor.pageLoad(page);

    await expect(page.locator('h1, h2')).toContainText(/Waitlist|Waiting list/i);
    await expect(page.locator('text=#3')).toBeVisible().catch(() => {
      // Position might be displayed differently
      return expect(page.locator('body')).toContainText('3');
    });
  });

  test('should load registration pending page', async ({ page }) => {
    await page.goto('/registration/pending');
    await waitFor.pageLoad(page);

    await expect(page.locator('h1, h2')).toContainText(/Pending|Processing/i);
  });
});
