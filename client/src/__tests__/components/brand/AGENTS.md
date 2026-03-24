<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-03-18 | Updated: 2026-03-18 -->

# brand

## Purpose
Unit tests for brand design system components.

## Key Files

| File | Description |
|------|-------------|
| `Buttons.test.tsx` | Tests for ClayButton, OutlineButton |
| `DarkCard.test.tsx` | Tests for DarkCard component |
| `PremiumCard.test.tsx` | Tests for PremiumCard component |
| `SectionHeader.test.tsx` | Tests for SectionHeader component |
| `StatusDot.test.tsx` | Tests for StatusDot component |
| `TelemetryCard.test.tsx` | Tests for TelemetryCard component |

## For AI Agents

### Working In This Directory
- Use React Testing Library patterns
- Test component rendering and props
- Test user interactions (clicks, hovers)
- Use `screen` queries for DOM access

### Test Pattern
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { ClayButton } from '@/components/brand/ClayButton';

describe('ClayButton', () => {
  it('renders with correct text', () => {
    render(<ClayButton>Click me</ClayButton>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<ClayButton onClick={handleClick}>Click</ClayButton>);
    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

<!-- MANUAL: -->
