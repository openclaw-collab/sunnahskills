<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-18 | Updated: 2026-03-18 -->

# client

## Purpose
React frontend application served as static assets. Contains the complete UI layer including pages, components, hooks, and the Stakeholder Studio review tool.

## Key Files

| File | Description |
|------|-------------|
| `index.html` | HTML entry point with root div for React |
| `src/main.tsx` | React application entry (createRoot + App) |
| `src/App.tsx` | Route definitions using Wouter Switch/Route |
| `src/index.css` | Global styles, Tailwind imports, CSS variables |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `src/components/` | React components organized by domain (see `src/components/AGENTS.md`) |
| `src/pages/` | Page-level route components (see `src/pages/AGENTS.md`) |
| `src/hooks/` | Custom React hooks (see `src/hooks/AGENTS.md`) |
| `src/lib/` | Utility functions and configurations (see `src/lib/AGENTS.md`) |
| `src/studio/` | Stakeholder Studio review tool (see `src/studio/AGENTS.md`) |
| `src/__tests__/` | Vitest unit tests (see `src/__tests__/AGENTS.md`) |
| `public/` | Static assets including GrappleMap data (see `public/AGENTS.md`) |

## For AI Agents

### Working In This Directory
- Vite dev server hot-reloads changes on `npm run dev`
- Path alias `@/` maps to `client/src/`
- All components use TypeScript with strict mode
- Import UI components from `@/components/ui/`
- Import brand components from `@/components/brand/`

### Testing Requirements
- Co-locate tests in `src/__tests__/` mirroring source structure
- Use React Testing Library + Vitest
- Mock API calls with `vi.mock()`

### Common Patterns
- `export default function ComponentName()` for components
- Props interfaces defined above component
- React Hook Form + Zod for forms
- TanStack Query for server state
- Tailwind classes for styling (no CSS modules)

## Dependencies

### Internal
- `shared/` - Shared TypeScript types and schemas

### External
See root `package.json` for full list. Key libraries:
- `react`, `react-dom` - Core React
- `wouter` - Routing
- `@tanstack/react-query` - Data fetching
- `@stripe/react-stripe-js` - Payment UI
- `framer-motion`, `gsap` - Animations
- `three`, `@react-three/fiber` - 3D graphics

<!-- MANUAL: -->
