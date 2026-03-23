<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-18 | Updated: 2026-03-18 -->

# components

## Purpose
React components organized by domain. Contains UI primitives (shadcn/ui), brand-specific components, registration wizard, payment forms, admin panels, and GrappleMap 3D viewer.

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `ui/` | shadcn/ui primitive components (see `ui/AGENTS.md`) |
| `brand/` | Brand design system components (see `brand/AGENTS.md`) |
| `registration/` | Multi-step registration wizard (see `registration/AGENTS.md`) |
| `payment/` | Stripe payment components (see `payment/AGENTS.md`) |
| `admin/` | Admin dashboard panels (see `admin/AGENTS.md`) |
| `grapplemap/` | 3D technique viewer components (see `grapplemap/AGENTS.md`) |
| `programs/` | `ProgramVisual`, `ProgramPageHeroMedia` — program photos + scrims |

## Key Files

| File | Description |
|------|-------------|
| `Navigation.tsx` | Site navigation with mobile menu |
| `Footer.tsx` | Site footer with links and info |

## For AI Agents

### Working In This Directory
- Each subdirectory has its own AGENTS.md with detailed info
- Import UI primitives from `ui/` or `@/components/ui/`
- Import brand components from `brand/` or `@/components/brand/`
- Keep components focused on a single responsibility

### Component Patterns
- Use functional components with TypeScript
- Define Props interface above component
- Default export for main component
- Named exports for sub-components or variants

### Styling
- Tailwind classes only
- Use brand color tokens: `bg-cream`, `bg-charcoal`, `text-clay`, `bg-moss`
- Responsive prefixes: `md:`, `lg:`, `xl:`

<!-- MANUAL: -->
