<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-03-18 | Updated: 2026-03-18 -->

# hooks

## Purpose
Unit tests for custom React hooks.

## For AI Agents

### Working In This Directory
- Use `@testing-library/react` renderHook
- Test hook return values
- Test state updates
- Test cleanup on unmount

### Test Pattern
```typescript
import { renderHook, act } from '@testing-library/react';
import { useCounter } from '@/hooks/useCounter';

describe('useCounter', () => {
  it('increments count', () => {
    const { result } = renderHook(() => useCounter());
    act(() => result.current.increment());
    expect(result.current.count).toBe(1);
  });
});
```

<!-- MANUAL: -->
