<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-18 | Updated: 2026-03-18 -->

# lib

## Purpose
Utility functions, configurations, and client-side service setup. Non-component shared logic for the frontend.

## Key Files

| File | Description |
|------|-------------|
| `utils.ts` | General utilities (cn helper, formatters) |
| `queryClient.ts` | TanStack Query client configuration |
| `programConfig.ts` | Program catalog (slugs, types, copy) |
| `programSchemas.ts` | Zod schemas for program forms |
| `stripe.ts` | Stripe.js initialization + appearance theme |

## For AI Agents

### Working In This Directory
- Keep functions pure when possible
- Export utility functions as named exports
- Use TypeScript strict typing
- Document function purposes with JSDoc comments

### Key Exports
- `cn(...)` - Merge Tailwind classes with clsx + tailwind-merge
- `queryClient` - Configured QueryClient instance
- `stripePromise` - Lazy-loaded Stripe instance
- `programs` - Array of program configurations

<!-- MANUAL: -->
