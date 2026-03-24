<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-18 | Updated: 2026-03-18 -->

# ui

## Purpose
shadcn/ui primitive components built on Radix UI. Unstyled, accessible, composable UI primitives used throughout the application.

## Component Inventory

### Layout
| Component | Radix Base | Description |
|-----------|------------|-------------|
| `card.tsx` | - | Card container with header, content, footer |
| `sheet.tsx` | Dialog | Slide-over panel |
| `dialog.tsx` | Dialog | Modal dialog |
| `drawer.tsx` | - | Mobile-first drawer (vaul) |
| `resizable.tsx` | - | Resizable panel groups |
| `separator.tsx` | Separator | Visual divider |
| `scroll-area.tsx` | ScrollArea | Custom scrollable container |

### Forms
| Component | Radix Base | Description |
|-----------|------------|-------------|
| `button.tsx` | - | Primary action button with variants |
| `input.tsx` | - | Text input field |
| `textarea.tsx` | - | Multi-line text input |
| `label.tsx` | Label | Form label |
| `form.tsx` | - | Form wrapper with React Hook Form |
| `checkbox.tsx` | Checkbox | Checkbox input |
| `radio-group.tsx` | RadioGroup | Radio button group |
| `select.tsx` | Select | Dropdown select |
| `switch.tsx` | Switch | Toggle switch |
| `slider.tsx` | Slider | Range slider |
| `input-otp.tsx` | - | OTP code input |

### Navigation
| Component | Radix Base | Description |
|-----------|------------|-------------|
| `tabs.tsx` | Tabs | Tabbed interface |
| `accordion.tsx` | Accordion | Expandable sections |
| `breadcrumb.tsx` | - | Navigation breadcrumbs |
| `navigation-menu.tsx` | NavigationMenu | Desktop navigation |
| `menubar.tsx` | Menubar | Menu bar |
| `command.tsx` | - | Command palette (cmdk) |

### Feedback
| Component | Radix Base | Description |
|-----------|------------|-------------|
| `alert.tsx` | - | Alert/notification banner |
| `alert-dialog.tsx` | AlertDialog | Confirm/cancel dialog |
| `toast.tsx` | - | Toast notifications |
| `toaster.tsx` | - | Toast container |
| `progress.tsx` | Progress | Progress bar |
| `skeleton.tsx` | - | Loading placeholder |

### Data Display
| Component | Radix Base | Description |
|-----------|------------|-------------|
| `table.tsx` | - | Data table |
| `badge.tsx` | - | Status badge |
| `avatar.tsx` | Avatar | User avatar |
| `card.tsx` | - | Content card |
| `chart.tsx` | - | Recharts wrapper |
| `calendar.tsx` | - | Date picker calendar |
| `carousel.tsx` | - | Embla carousel |

### Overlays
| Component | Radix Base | Description |
|-----------|------------|-------------|
| `tooltip.tsx` | Tooltip | Hover tooltip |
| `popover.tsx` | Popover | Floating content |
| `hover-card.tsx` | HoverCard | Card on hover |
| `dropdown-menu.tsx` | DropdownMenu | Dropdown menu |
| `context-menu.tsx` | ContextMenu | Right-click menu |

### For AI Agents

#### Working In This Directory
- Components are auto-generated via shadcn CLI
- Use `npx shadcn add <component>` to add new primitives
- Components are styled with Tailwind + cva (class-variance-authority)
- Don't manually edit variants unless necessary

#### Usage Pattern
```typescript
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

<Card>
  <CardHeader>Title</CardHeader>
  <CardContent>Content</CardContent>
</Card>
<Button variant="default">Click me</Button>
```

#### Styling Notes
- Default style uses neutral colors
- Override via className prop
- Variants defined with cva: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`

<!-- MANUAL: -->
