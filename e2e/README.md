# E2E Test Suite - Sunnah Skills

This directory contains Playwright end-to-end tests for the Sunnah Skills application.

## Test Structure

```
e2e/
├── fixtures.ts              # Test fixtures and helpers
├── global-setup.ts          # Global setup (runs once before all tests)
├── global-teardown.ts       # Global teardown (runs once after all tests)
├── public-pages.spec.ts     # Public page tests (Home, Programs, Schedule, etc.)
├── registration.spec.ts     # Registration journey tests
├── admin.spec.ts            # Admin dashboard tests
├── responsive.spec.ts       # Responsive design tests
├── accessibility.spec.ts    # Accessibility tests (a11y, keyboard nav)
├── performance.spec.ts      # Performance tests
└── README.md                # This file
```

## Running Tests

### Install Playwright

```bash
npm install -D @playwright/test
npx playwright install
```

### Run All Tests

```bash
npx playwright test
```

### Run Specific Test File

```bash
npx playwright test e2e/public-pages.spec.ts
```

### Run Tests in Specific Browser

```bash
npx playwright test --project=chromium-desktop
npx playwright test --project=firefox-desktop
npx playwright test --project=webkit-desktop
```

### Run Tests in Headed Mode (visible browser)

```bash
npx playwright test --headed
```

### Run Tests with UI Mode

```bash
npx playwright test --ui
```

### Debug Tests

```bash
npx playwright test --debug
```

## Test Categories

### 1. Public Pages (`public-pages.spec.ts`)

Tests for public-facing pages:
- Homepage hero, navigation, CTAs
- Programs listing and detail pages
- Schedule page with weekly/monthly views
- About and Contact pages
- 404 page handling

### 2. Registration Journey (`registration.spec.ts`)

Tests for the registration flow:
- Registration hub with all programs
- Multi-step wizard for each program (BJJ, Archery, Outdoor, Bullyproofing)
- Form validation and navigation
- Discount code application
- Success/Waitlist/Cancel pages

### 3. Admin Journey (`admin.spec.ts`)

Tests for admin functionality:
- Login form validation
- Dashboard navigation and tabs
- Registration management
- Payments, Discounts, Pricing, Sessions, Contacts
- Export functionality

### 4. Responsive Testing (`responsive.spec.ts`)

Tests for responsive design across viewports:
- Mobile (iPhone SE, iPhone 14, Pixel 7)
- Tablet (iPad Mini, iPad Pro)
- Desktop (Small, Large)
- Navigation adaptation
- Touch target sizes
- Typography and spacing

### 5. Accessibility (`accessibility.spec.ts`)

Tests for accessibility compliance:
- Image alt text
- Form labels
- ARIA landmarks
- Keyboard navigation
- Focus indicators
- Screen reader support
- Color contrast

### 6. Performance (`performance.spec.ts`)

Tests for performance metrics:
- Page load times (TTFB, FCP, LCP)
- Resource loading (JS bundle sizes, image optimization)
- Runtime performance (60fps scroll, CLS)
- Mobile performance
- Core Web Vitals

## Configuration

### Playwright Config (`playwright.config.ts`)

- **Base URL**: `http://localhost:5173` (dev server)
- **Browsers**: Chromium, Firefox, WebKit
- **Viewports**: Mobile, Tablet, Desktop
- **Retries**: 2 on CI, 0 locally
- **Workers**: 1 on CI, auto locally
- **Artifacts**: Screenshots, videos, traces on failure

### Environment Variables

```bash
# Admin credentials for authenticated tests
ADMIN_EMAIL=admin@sunnahskills.com
ADMIN_PASSWORD=your-password

# Base URL override
PLAYWRIGHT_BASE_URL=http://localhost:5173
```

## Fixtures

Custom fixtures in `fixtures.ts`:

- `page` - Standard Playwright page
- `a11yPage` - Page with accessibility helpers
- `mobilePage` - Mobile viewport (375x812)
- `tabletPage` - Tablet viewport (1024x768)
- `adminPage` - Pre-authenticated admin page

## Helpers

### Navigation

```typescript
import { navigateTo } from './fixtures';

await navigateTo.home(page);
await navigateTo.programs(page);
await navigateTo.program(page, 'bjj');
await navigateTo.schedule(page);
await navigateTo.register(page);
await navigateTo.admin(page);
```

### Test Data

```typescript
import { generateTestData } from './fixtures';

const guardian = generateTestData.guardian();
const student = generateTestData.student();
const registration = generateTestData.registration();
```

## Best Practices

1. **Use fixtures** for common setup
2. **Use navigation helpers** for page transitions
3. **Add data-testid** attributes for stable selectors
4. **Take screenshots** for visual regression
5. **Test across viewports** for responsive design
6. **Test keyboard navigation** for accessibility
7. **Check performance metrics** regularly

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

## Troubleshooting

### Tests failing locally

1. Ensure dev server is not already running
2. Check that all dependencies are installed
3. Try running with `--headed` to see what's happening
4. Use `--debug` for step-by-step debugging

### Tests flaky on CI

1. Increase timeouts in `playwright.config.ts`
2. Add more retries: `retries: 3`
3. Check for race conditions in the app
4. Use `waitFor` helpers for async operations

### Screenshots not matching

1. Update snapshots: `npx playwright test --update-snapshots`
2. Check for font rendering differences
3. Ensure consistent viewport sizes

## Adding New Tests

1. Create a new `.spec.ts` file in `e2e/`
2. Import fixtures: `import { test, expect } from './fixtures';`
3. Use `test.describe` for grouping
4. Add tests with `test('should...', async ({ page }) => { ... });`
5. Run tests to verify: `npx playwright test e2e/your-test.spec.ts`
