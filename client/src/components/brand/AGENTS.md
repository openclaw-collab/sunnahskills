<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-18 | Updated: 2026-03-18 -->

# brand

## Purpose
Brand-specific design system components. Custom UI primitives implementing the Sunnah Skills visual identity with cream/charcoal/moss/clay color palette.

## Key Files

| File | Description |
|------|-------------|
| `ClayButton.tsx` | Primary CTA with clay (#CE5833) fill |
| `OutlineButton.tsx` | Secondary action with border |
| `MagneticButton.tsx` | Magnetic hover effect CTA |
| `DarkCard.tsx` | Dark charcoal surface card |
| `PremiumCard.tsx` | Cream/light card with shadow |
| `TelemetryCard.tsx` | Card with `title`, `label`, optional icon, and children |
| `SectionHeader.tsx` | Page/section title with eyebrow label |
| `StatusDot.tsx` | Colored enrollment status indicator |

## Brand Palette

| Token | Hex | Use |
|-------|-----|-----|
| `cream` | `#F5F0E8` | Page background |
| `charcoal` | `#1A1A1A` | Dark surfaces, primary text |
| `moss` | `#3D5A3E` | Accent, section dividers |
| `clay` | `#CE5833` | CTAs, highlights |

## Typography

| Font | Use |
|------|-----|
| Outfit | Headings |
| Plus Jakarta Sans | Body text |
| Cormorant Garamond | Serif accent (quotes) |
| JetBrains Mono | Labels, mono code |

## For AI Agents

### Working In This Directory
- Import from `@/components/brand/ComponentName`
- Use instead of raw shadcn for brand consistency
- Combine multiple brand components for complex layouts

### Patterns
```typescript
import { ClayButton } from "@/components/brand/ClayButton";
import { DarkCard } from "@/components/brand/DarkCard";
import { SectionHeader } from "@/components/brand/SectionHeader";

<SectionHeader eyebrow="Programs" title="Our Programs" />
<DarkCard>
  <h3>Card Title</h3>
  <ClayButton>Get Started</ClayButton>
</DarkCard>
```

<!-- MANUAL: -->
