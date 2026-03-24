<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-18 | Updated: 2026-03-18 -->

# hooks

## Purpose
Custom React hooks for shared stateful logic. Encapsulates complex interactions like registration state management and form validation.

## Key Files

| File | Description |
|------|-------------|
| `useRegistration.ts` | Registration draft state + localStorage persistence |
| `useStepValidation.ts` | Per-step form field validation |
| `use-mobile.tsx` | Mobile breakpoint detection (shadcn) |

## For AI Agents

### Working In This Directory
- Hooks follow `useHookName` naming convention
- Return typed objects or arrays
- Handle cleanup in `useEffect` return
- Export as named exports

### Patterns
```typescript
export function useHookName() {
  const [state, setState] = useState(...);

  useEffect(() => {
    // side effects
    return () => { /* cleanup */ };
  }, [deps]);

  const handler = useCallback(() => {
    // logic
  }, [deps]);

  return { state, handler };
}
```

<!-- MANUAL: -->
