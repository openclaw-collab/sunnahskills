# Testing Strategy

## Overview

Sunnah Skills uses a comprehensive testing approach covering unit, integration, and end-to-end tests. The strategy prioritizes testing critical user paths—registration, payments, and admin workflows—while maintaining fast feedback loops for developers.

## Test Pyramid Structure

```
       /\
      /  \
     / E2E \          <- 10% of tests (Playwright)
    /________\            Critical user journeys
   /          \
  / Integration \      <- 30% of tests (RTL + MSW)
 /______________\          Component interaction, API mocking
/                \
/     Unit         \   <- 60% of tests (Vitest)
/____________________\    Pure functions, hooks, utilities
```

### Layer Distribution

| Layer | Percentage | Count (Target) | Purpose |
|-------|-----------|----------------|---------|
| Unit | 60% | ~150 tests | Hooks, utilities, validation logic, store methods |
| Integration | 30% | ~75 tests | Component rendering, user interactions, form validation |
| E2E | 10% | ~25 tests | Critical paths: registration → payment → confirmation |

### Test Characteristics

**Unit Tests**
- Fast execution (< 100ms per test)
- No external dependencies
- Pure function testing
- Hook behavior verification
- Store/state management logic

**Integration Tests**
- Component + hook integration
- Mocked API calls (MSW)
- User event simulation
- Form submission flows
- Route transitions

**E2E Tests**
- Full browser automation
- Real payment sandbox
- Cross-page navigation
- Email receipt verification
- Admin workflow completion

## Coverage Goals

### Overall Targets

| Metric | Target | Threshold |
|--------|--------|-----------|
| Statements | 80% | 75% |
| Branches | 75% | 70% |
| Functions | 85% | 80% |
| Lines | 80% | 75% |

### Coverage by Module

| Module | Priority | Target Coverage |
|--------|----------|----------------|
| Registration hooks | Critical | 90% |
| Payment components | Critical | 85% |
| Form validation | Critical | 90% |
| Admin dashboard | High | 80% |
| Studio overlay | Medium | 70% |
| Marketing pages | Low | 50% |
| Utility functions | High | 85% |

### Coverage Exclusions

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      exclude: [
        '**/*.d.ts',
        '**/node_modules/**',
        '**/dist/**',
        '**/__tests__/**',
        '**/*.config.*',
        'client/src/main.tsx',        // Entry point
        'client/src/App.tsx',         // Router setup
        '**/components/ui/**',        // shadcn/ui primitives
        '**/lib/queryClient.ts',      // TanStack Query setup
        '**/studio/**',               // Third-party studio integration
      ],
    },
  },
});
```

## Testing Tools

### Core Framework

| Tool | Version | Purpose |
|------|---------|---------|
| Vitest | ^4.1.0 | Test runner, assertions, mocking |
| @testing-library/react | ^16.3.2 | Component rendering, queries |
| @testing-library/jest-dom | ^6.9.1 | DOM matchers (toBeInTheDocument) |
| @testing-library/dom | ^10.4.1 | User interaction utilities |
| jsdom | ^29.0.0 | Browser environment simulation |

### E2E & Integration

| Tool | Version | Purpose |
|------|---------|---------|
| Playwright | ^1.40.0 | End-to-end browser automation |
| MSW (Mock Service Worker) | ^2.0.0 | API mocking for integration tests |
| @playwright/test | ^1.40.0 | Playwright test runner |

### Backend Testing

| Tool | Version | Purpose |
|------|---------|---------|
| Miniflare | ^3.0.0 | Cloudflare Workers local runtime |
| wrangler | ^4.24.3 | D1 database local simulation |

### Installation

```bash
# Core testing (already in devDependencies)
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom

# E2E testing
npm install -D @playwright/test
npx playwright install

# API mocking
npm install -D msw

# Backend/local simulation
npm install -D miniflare
```

## Test Organization

### Directory Structure

```
client/src/__tests__/
├── components/
│   ├── brand/                    # Design system components
│   │   ├── Buttons.test.tsx
│   │   ├── DarkCard.test.tsx
│   │   ├── PremiumCard.test.tsx
│   │   ├── SectionHeader.test.tsx
│   │   ├── StatusDot.test.tsx
│   │   └── TelemetryCard.test.tsx
│   ├── registration/             # Registration wizard
│   │   ├── RegistrationWizard.test.tsx
│   │   ├── StepGuardianInfo.test.tsx
│   │   ├── StepStudentInfo.test.tsx
│   │   ├── StepProgramDetails.test.tsx
│   │   ├── StepWaivers.test.tsx
│   │   └── StepPayment.test.tsx
│   ├── admin/                    # Admin dashboard
│   │   ├── RegistrationsTable.test.tsx
│   │   ├── RegistrationDetail.test.tsx
│   │   ├── AdminLogin.test.tsx
│   │   └── AdminDashboard.test.tsx
│   ├── payment/                  # Stripe integration
│   │   ├── PaymentForm.test.tsx
│   │   ├── PaymentProvider.test.tsx
│   │   └── OrderSummary.test.tsx
│   └── ui/                       # shadcn/ui primitives (smoke tests)
│       └── *.test.tsx
├── hooks/                        # Custom React hooks
│   ├── useRegistration.test.ts
│   ├── useStudio.test.ts
│   └── useLocalStorage.test.ts
├── lib/                          # Utilities and config
│   ├── programConfig.test.ts
│   ├── validation.test.ts
│   └── utils.test.ts
├── integration/                  # Flow tests
│   ├── registration-flow.test.tsx
│   ├── payment-flow.test.tsx
│   └── admin-flow.test.tsx
├── mocks/                        # MSW setup
│   ├── handlers.ts
│   ├── server.ts
│   └── data/
│       ├── programs.ts
│       ├── registrations.ts
│       └── payments.ts
├── e2e/                          # Playwright tests
│   ├── registration.spec.ts
│   ├── payment.spec.ts
│   ├── admin.spec.ts
│   └── studio.spec.ts
├── test-utils.tsx                # Custom render wrapper
└── setup.ts                      # Test environment setup
```

### Naming Conventions

| Pattern | Example | Purpose |
|---------|---------|---------|
| Component tests | `ComponentName.test.tsx` | React component tests |
| Hook tests | `useHookName.test.ts` | Custom hook tests |
| Utility tests | `functionName.test.ts` | Pure function tests |
| Integration tests | `feature-flow.test.tsx` | Multi-component flows |
| E2E tests | `feature.spec.ts` | Playwright tests |

### File Organization Rules

1. **Co-location**: Test files live in `__tests__/` mirroring the `src/` structure
2. **One suite per feature**: Group related tests in describe blocks
3. **Test ID naming**: Use `data-testid` for querying elements
4. **Mock data**: Centralize in `__tests__/mocks/data/`

## Mocking Strategy

### External Services

#### Stripe

```typescript
// __tests__/mocks/stripe.ts
export const mockStripe = {
  confirmPayment: vi.fn().mockResolvedValue({
    error: null,
    paymentIntent: { status: 'succeeded' }
  }),
  elements: {
    getElement: vi.fn().mockReturnValue({
      on: vi.fn(),
      mount: vi.fn(),
    }),
  },
};

// Mock @stripe/stripe-js
vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn().mockResolvedValue(mockStripe),
}));
```

#### D1 Database

```typescript
// __tests__/mocks/d1.ts
export class MockD1Database {
  private data: Map<string, any[]> = new Map();

  prepare(sql: string) {
    return {
      bind: (...params: any[]) => ({
        first: () => this.queryFirst(sql, params),
        all: () => this.queryAll(sql, params),
        run: () => this.run(sql, params),
      }),
    };
  }

  private queryFirst(sql: string, params: any[]) {
    // Implementation
  }

  // ... additional methods
}

// Usage in test
const mockEnv = {
  DB: new MockD1Database(),
};
```

#### MailChannels

```typescript
// __tests__/mocks/mailchannels.ts
export const mockMailChannels = {
  send: vi.fn().mockResolvedValue({ success: true }),
};

global.fetch = vi.fn((url: string) => {
  if (url.includes('mailchannels.net')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
  }
  return Promise.resolve({ ok: true });
});
```

#### localStorage

```typescript
// __tests__/mocks/localStorage.ts
export class MockLocalStorage {
  private store: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

// Setup in test
Object.defineProperty(window, 'localStorage', {
  value: new MockLocalStorage(),
});
```

### MSW Setup (API Mocking)

```typescript
// __tests__/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/programs', () => {
    return HttpResponse.json([
      { slug: 'bjj', title: 'Brazilian Jiu-Jitsu', price: 199 },
      { slug: 'archery', title: 'Archery', price: 149 },
    ]);
  }),

  http.post('/api/register', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      registrationId: 123,
      status: 'pending_payment',
    });
  }),

  http.post('/api/payments/create-intent', () => {
    return HttpResponse.json({
      clientSecret: 'pi_test_secret_test',
    });
  }),

  http.get('/api/auth/me', () => {
    return HttpResponse.json({
      id: 1,
      email: 'admin@example.com',
      name: 'Admin User',
    });
  }),
];
```

```typescript
// __tests__/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);

// Start/stop in setup files
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## Test Utilities

### Custom Render

```typescript
// __tests__/test-utils.tsx
import React from 'react';
import { render as rtlRender } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { StudioProvider } from '@/studio/StudioProvider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

function AllTheProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <StudioProvider>
          {children}
        </StudioProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export function render(ui: React.ReactElement, options = {}) {
  return rtlRender(ui, {
    wrapper: AllTheProviders,
    ...options
  });
}

export * from '@testing-library/react';
```

### Test Factories

```typescript
// __tests__/factories/registration.ts
import { RegistrationDraft } from '@/hooks/useRegistration';

export function createRegistrationDraft(
  overrides: Partial<RegistrationDraft> = {}
): RegistrationDraft {
  return {
    programSlug: 'bjj',
    guardian: {
      fullName: 'Parent Name',
      email: 'parent@example.com',
      phone: '555-1234',
    },
    student: {
      fullName: 'Student Name',
      birthDate: '2010-01-01',
      gender: 'male',
      experienceLevel: 'beginner',
    },
    programSpecific: {},
    waivers: {
      liability: false,
      photo: false,
    },
    ...overrides,
  };
}
```

### Async Utilities

```typescript
// __tests__/utils/async.ts
import { waitFor } from '@testing-library/react';

export async function waitForLoadingToFinish() {
  return waitFor(() => {
    expect(document.querySelector('[data-testid="loading"]')).not.toBeInTheDocument();
  });
}

export async function fillFormField(label: string, value: string) {
  const input = screen.getByLabelText(label);
  await userEvent.clear(input);
  await userEvent.type(input, value);
}
```

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [main, prototype]
  pull_request:
    branches: [main, prototype]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm test -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          fail_ci_if_error: false

  type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run typecheck

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Build app
        run: npm run build

      - name: Run Playwright tests
        run: npx playwright test
        env:
          STRIPE_PUBLISHABLE_KEY: ${{ secrets.STRIPE_TEST_PUBLISHABLE_KEY }}
          STRIPE_SECRET_KEY: ${{ secrets.STRIPE_TEST_SECRET_KEY }}

      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

### Pre-commit Hooks

```json
// .husky/pre-commit
{
  "hooks": {
    "pre-commit": "lint-staged"
  }
}

// lint-staged.config.js
module.exports = {
  '*.{ts,tsx}': [
    'eslint --fix',
    'vitest related --run',
  ],
};
```

## Running Tests

### Commands

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- StepGuardianInfo.test.tsx

# Run tests matching pattern
npm test -- -t "updates guardian"

# Run E2E tests
npx playwright test

# Run E2E with UI
npx playwright test --ui

# Debug E2E test
npx playwright test --debug
```

### Watch Mode Shortcuts

| Key | Action |
|-----|--------|
| `a` | Run all tests |
| `f` | Run only failed tests |
| `p` | Filter by filename pattern |
| `t` | Filter by test name pattern |
| `q` | Quit watch mode |

## Writing Effective Tests

### Component Test Example

```typescript
// __tests__/components/registration/StepGuardianInfo.test.tsx
import { describe, expect, it, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render } from '@/__tests__/test-utils';
import { StepGuardianInfo } from '@/components/registration/StepGuardianInfo';
import { useRegistration } from '@/hooks/useRegistration';

function TestHarness() {
  const { draft, updateDraft } = useRegistration('bjj');
  return <StepGuardianInfo draft={draft} updateDraft={updateDraft} />;
}

describe('StepGuardianInfo', () => {
  it('validates required fields', async () => {
    render(<TestHarness />);

    // Try to proceed without filling fields
    const submitButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(submitButton);

    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText(/full name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });
  });

  it('accepts valid guardian information', async () => {
    render(<TestHarness />);

    // Fill in the form
    await userEvent.type(screen.getByLabelText(/full name/i), 'Parent Name');
    await userEvent.type(screen.getByLabelText(/email/i), 'parent@example.com');
    await userEvent.type(screen.getByLabelText(/phone/i), '555-123-4567');

    // Should not show validation errors
    expect(screen.queryByText(/is required/i)).not.toBeInTheDocument();
  });
});
```

### Hook Test Example

```typescript
// __tests__/hooks/useRegistration.test.ts
import { describe, expect, it } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRegistration } from '@/hooks/useRegistration';

describe('useRegistration', () => {
  it('manages step navigation', () => {
    const { result } = renderHook(() => useRegistration('bjj'));

    expect(result.current.currentStepIndex).toBe(0);

    act(() => result.current.goNext());
    expect(result.current.currentStepIndex).toBe(1);

    act(() => result.current.goBack());
    expect(result.current.currentStepIndex).toBe(0);
  });

  it('updates draft immutably', () => {
    const { result } = renderHook(() => useRegistration('bjj'));

    act(() => {
      result.current.updateDraft((prev) => ({
        ...prev,
        guardian: { ...prev.guardian, fullName: 'New Name' },
      }));
    });

    expect(result.current.draft.guardian.fullName).toBe('New Name');
  });

  it('validates step completion', () => {
    const { result } = renderHook(() => useRegistration('bjj'));

    // Step 0 should be valid initially (no required fields)
    expect(result.current.isStepValid(0)).toBe(true);

    // Step 1 requires guardian info
    expect(result.current.isStepValid(1)).toBe(false);
  });
});
```

### E2E Test Example

```typescript
// __tests__/e2e/registration.spec.ts
import { test, expect } from '@playwright/test';

test('complete registration flow', async ({ page }) => {
  // Start registration
  await page.goto('/programs/bjj/register');

  // Step 1: Guardian Info
  await page.fill('[name="guardian.fullName"]', 'Parent Name');
  await page.fill('[name="guardian.email"]', 'parent@example.com');
  await page.fill('[name="guardian.phone"]', '555-123-4567');
  await page.click('button:has-text("Next")');

  // Step 2: Student Info
  await page.fill('[name="student.fullName"]', 'Student Name');
  await page.fill('[name="student.birthDate"]', '2010-01-01');
  await page.selectOption('[name="student.gender"]', 'male');
  await page.click('button:has-text("Next")');

  // Step 3: Program Details
  await page.selectOption('[name="experienceLevel"]', 'beginner');
  await page.click('button:has-text("Next")');

  // Step 4: Waivers
  await page.check('[name="waivers.liability"]');
  await page.check('[name="waivers.photo"]');
  await page.click('button:has-text("Next")');

  // Step 5: Payment
  await page.waitForSelector('[data-testid="payment-form"]');

  // Fill Stripe Elements (in test mode)
  const stripeFrame = page.frameLocator('iframe').first();
  await stripeFrame.fill('[name="cardnumber"]', '4242424242424242');
  await stripeFrame.fill('[name="exp-date"]', '12/25');
  await stripeFrame.fill('[name="cvc"]', '123');

  await page.click('button:has-text("Pay")');

  // Verify success
  await page.waitForURL('/registration/success?rid=*');
  expect(await page.textContent('h1')).toContain('Registration Complete');
});
```

## Debugging Tests

### Common Issues

**"Unable to find element"**
- Check if element is inside a portal (Tooltip, Dialog)
- Use `screen.debug()` to print DOM
- Add `await waitFor()` for async rendering

**"act() warnings"**
- Wrap state updates in `act()`
- Use `await waitFor()` for assertions after async operations

**"ResizeObserver is not defined"**
- Already polyfilled in `vitest.setup.ts`

**"window.matchMedia is not a function"**
- Add mock in setup file:
```typescript
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

### Debug Utilities

```typescript
// Print current DOM state
screen.debug();

// Print specific element
screen.debug(screen.getByRole('button'));

// Log all roles (useful for finding query selectors)
screen.logRoles();

// Pause E2E test for inspection
await page.pause();

// Slow down E2E actions
await page.goto('/path', { slowMo: 100 });
```

## Best Practices

1. **Test behavior, not implementation** - Query by role/label, not test IDs
2. **One assertion per test** - Keep tests focused and readable
3. **Use factories** - Generate test data consistently
4. **Mock at boundaries** - Mock API calls, not internal functions
5. **Clean up after tests** - Reset mocks, clean localStorage
6. **Test error states** - Don't just test the happy path
7. **Keep tests fast** - Avoid timeouts, use fake timers
8. **Document complex setups** - Add comments explaining test prerequisites

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/)
- [MSW Documentation](https://mswjs.io/)
- [Testing Patterns for React](https://kentcdodds.com/blog/fix-the-not-wrapped-in-act-warning)
