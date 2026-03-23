<!-- Generated: 2026-03-18 | Updated: 2026-03-18 -->

# Sunnah Skills

## Purpose
A production-grade youth martial arts & outdoor program platform with integrated registration, Stripe payments, admin dashboard, and Stakeholder Studio review tool. Built for Sunnah Skills Academy offering BJJ, Archery, Outdoor Workshops, and Bullyproofing programs.

**Current focus:** BJJ-only live registration; week+month schedule; guardian account + magic link; family cart + `shared/orderPricing` + `GET /api/programs` (`active_semester`) for UI estimates; Stripe + webhooks per `docs/NEXT_AGENT.md`.

## Key Files

| File | Description |
|------|-------------|
| `package.json` | Project dependencies and npm scripts (React 18, Vite, TypeScript) |
| `wrangler.toml` | Cloudflare Pages configuration with D1 database binding |
| `tsconfig.json` | TypeScript configuration with path aliases (@/*) |
| `tailwind.config.ts` | Tailwind CSS configuration with brand colors (cream, charcoal, moss, clay) |
| `vite.config.ts` | Vite build configuration with React plugin |
| `.env.example` | Environment variable template for local development |
| `sunnahskills.html` | Original static HTML mockup (design reference) |
| `README.md` | Comprehensive project documentation and quick start guide |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `client/` | React frontend application source (see `client/AGENTS.md`) |
| `functions/` | Cloudflare Pages Functions API endpoints (see `functions/AGENTS.md`) |
| `db/` | D1 database schema and seed data (see `db/AGENTS.md`) |
| `docs/` | Extended project documentation (see `docs/AGENTS.md`) |
| `shared/` | Shared TypeScript types and schemas (see `shared/AGENTS.md`) |
| `scripts/` | Build and utility scripts (see `scripts/AGENTS.md`) |
| `.github/` | GitHub Actions workflows (see `.github/AGENTS.md`) |
| `.cursor/` | Cursor IDE rules (see `.cursor/AGENTS.md`) |
| `GrappleMap/` | External 3D grappling visualization project (see `GrappleMap/AGENTS.md`) |

## For AI Agents

### Working In This Directory
- Run `npm install` after modifying dependencies
- Use `npm run dev` for local development (Vite dev server on :5173)
- Run `npm run typecheck` before committing TypeScript changes
- Run `npm test` to execute Vitest unit tests
- Build with `npm run build` → outputs to `dist/`

### Testing Requirements
- Unit tests use Vitest + React Testing Library
- Test files live in `client/src/__tests__/` mirroring source structure
- Run `npx wrangler pages dev dist --d1=DB` for full local testing with D1

### Common Patterns
- TypeScript strict mode enabled
- Barrel exports via `index.ts` files
- Path alias `@/` maps to `client/src/`
- Functional components with hooks
- Tailwind CSS for all styling
- React Hook Form + Zod for form validation

## Tech Stack

### Frontend
- React 18 + Vite + TypeScript 5.6
- Wouter (routing)
- TanStack Query v5 (data fetching)
- shadcn/ui + Radix UI (component primitives)
- Tailwind CSS 3.4 + tailwindcss-animate
- GSAP + ScrollTrigger (animations)
- Three.js + @react-three/fiber (3D GrappleMap)

### Backend
- Cloudflare Pages Functions (Workers runtime)
- Cloudflare D1 (SQLite database)
- Stripe Elements + Stripe API (payments)
- MailChannels (transactional email)
- bcrypt (password hashing)

### Deployment
- Cloudflare Pages (prototype branch auto-deploys)
- D1 database: `sunnahskills-admin-v2`

<!-- MANUAL: -->

---

# Sunnah Skills Developer Agent Instructions

## Your Mission

Complete the launch of the Sunnah Skills registration platform, then operate it post-launch.

## Critical Rules

### 1. Launch Blockers First
Nothing else matters until launch. Priority order:
1. Stripe live mode
2. Custom domain (sunnahskills.com)
3. D1 point-in-time backups
4. Framer Motion animations
5. Real brand images
6. Email automation
7. Admin rate limiting

### 2. Registration Flow is Sacred
Parents register their children on phones. The flow must NEVER break:
- Test after every change
- Mobile-first responsive design
- Clear error messages
- Secure payment handling

### 3. 30-Minute Checkpoints
Work in focused sprints:
- Set timer for 30 minutes
- Write checkpoint to .agent/progress.md
- Test registration flow
- Git commit
- Report status

## Initialization Phase (First Run Only)

On your FIRST session, complete these steps before any work:

### Step 1: Read Project Context (5 min)
- Read this AGENTS.md file
- List project directory structure
- Identify current launch status

### Step 2: Analyze Codebase (10 min)
- Examine registration flow in client/src/components/registration/
- Check Stripe integration status in functions/api/payments/
- Review admin dashboard in client/src/components/admin/
- Look for TODO comments or incomplete features

### Step 3: Identify Launch Blockers (10 min)
- Check if Stripe is in test or live mode
- Domain configuration status
- Animation implementation status
- Missing images/assets

### Step 4: Write Initialization Report
Create `.agent/initialization-report.md` with:
- Current launch readiness (percentage)
- Launch blockers found
- Technical findings
- Proposed first tasks (awaiting approval)

### Step 5: WAIT FOR APPROVAL
STOP. Do not proceed. Wait for user to review initialization-report.md and approve tasks.

## Post-Initialization Workflow

Work in 30-minute cycles:
1. Pick approved task
2. Work 30 min
3. Write checkpoint to .agent/progress.md
4. Test registration flow
5. Git commit with [Task N] prefix
6. Report status

## Model Usage (STRICT)

- **Kimi K2.5**: ALL coding, planning, debugging, architecture
- **ZAI (GLM 4.7)**: Research ONLY
- **NEVER MiniMax**
