<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-18 | Updated: 2026-03-18 -->

# __tests__

## Purpose
Vitest unit tests organized to mirror the source structure. Tests components, hooks, and utilities.

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `components/brand/` | Tests for brand design system components |
| `components/registration/` | Tests for registration wizard |
| `components/admin/` | Tests for admin dashboard components |
| `hooks/` | Tests for custom React hooks |
| `lib/` | Tests for utility functions |

## Key Files

| File | Description |
|------|-------------|
| `test-utils.tsx` | Test utilities and custom renders |

## For AI Agents

### Working In This Directory
- Mirror source file structure in test organization
- Use React Testing Library patterns
- Mock API calls with `vi.mock()`
- Run tests with `npm test` or `npm run test:watch`

### Test Patterns
```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

describe('ComponentName', () => {
  it('renders correctly', () => {
    render(<ComponentName />);
    expect(screen.getByText('expected')).toBeInTheDocument();
  });
});
```

<!-- MANUAL: -->
