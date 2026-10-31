# Brightloop Design System

## Design Philosophy

Brightloop uses a **premium, restrained, Apple-inspired** visual language. The interface prioritizes clarity, hierarchy, precision, and consistency over decoration.

### Core Principles

1. **Editorial Typography** — Strong hierarchy with Inter font, clear scale from 12px to 36px
2. **Generous Whitespace** — Purposeful spacing that gives content room to breathe
3. **Calm Surfaces** — Warm white/light neutral backgrounds (`#FAFAF9` and `#FFFFFF`), near-black text (`#1C1917`)
4. **Restrained Accent** — Single indigo accent color (`#4F46E5`) used sparingly for primary actions and focus states
5. **Subtle Motion** — Short, purposeful transitions (150ms); respects `prefers-reduced-motion`
6. **Readable Density** — Business tables remain efficient; minimalism never hides important data

---

## Color Tokens

### Neutral Palette

| Token | Value | Usage |
|---|---|---|
| `background` | `#FAFAF9` | Page background (warm stone-50) |
| `surface` | `#FFFFFF` | Cards, panels, elevated surfaces |
| `surface-secondary` | `#F5F5F4` | Secondary backgrounds, hover states |
| `border` | `#E7E5E4` | Default borders |
| `border-strong` | `#D6D3D1` | Emphasized borders |
| `text-primary` | `#1C1917` | Headings, body text |
| `text-secondary` | `#57534E` | Descriptions, secondary info |
| `text-tertiary` | `#A8A29E` | Placeholders, hints |

### Accent

| Token | Value | Usage |
|---|---|---|
| `accent` | `#4F46E5` | Primary buttons, links, focus rings |
| `accent-hover` | `#4338CA` | Hover state for accent elements |
| `accent-light` | `#EEF2FF` | Accent backgrounds, selected states |

### Status Colors

| Token | Value | Usage |
|---|---|---|
| `success` / `success-light` | `#16A34A` / `#F0FDF4` | Active, paid, confirmed |
| `warning` / `warning-light` | `#D97706` / `#FFFBEB` | Paused, due soon, attention |
| `error` / `error-light` | `#DC2626` / `#FEF2F2` | Overdue, void, rejected |
| `info` / `info-light` | `#2563EB` / `#EFF6FF` | Informational, draft |

---

## Typography

**Font Family:** Inter (with system-ui fallback)

| Level | Size | Weight | Usage |
|---|---|---|---|
| Display | 2.25rem (36px) | 700 | Hero/page titles |
| Heading 1 | 1.875rem (30px) | 600 | Page headings |
| Heading 2 | 1.5rem (24px) | 600 | Section headings |
| Heading 3 | 1.25rem (20px) | 600 | Card/panel headings |
| Body Large | 1.125rem (18px) | 400 | Lead paragraphs |
| Body | 1rem (16px) | 400 | Default body text |
| Body Small | 0.875rem (14px) | 400 | Table cells, form labels |
| Caption | 0.75rem (12px) | 500 | Badges, timestamps, hints |

---

## Spacing

Based on a 4px grid:
- `1` = 4px — Tight padding (badge internals)
- `2` = 8px — Inline spacing, icon gaps
- `3` = 12px — Form field gap
- `4` = 16px — Card padding, section gap
- `6` = 24px — Page section spacing
- `8` = 32px — Major section breaks
- `12` = 48px — Page vertical rhythm
- `16` = 64px — Hero spacing

---

## Radii & Shadows

| Token | Radii Value | Usage |
|---|---|---|
| `sm` | 6px | Badges, small buttons |
| `md` | 8px | Buttons, inputs, textareas, cards |
| `lg` | 12px | Dialogs, alert dialogs, large cards |
| `xl` | 16px | Hero cards, modals |
| `full` | 9999px | Avatars, pills |

---

## Reusable Components

### UI Primitives (`src/components/ui/`)
- **Button** — variants: default, secondary, outline, ghost, destructive, link; sizes: sm, default, lg, icon
- **Input** — clean text input with focus ring and error support
- **Textarea** — multi-line input with consistent padding and typography
- **Label** — accessible form label primitive via Radix
- **Select** — polished dropdown selection via Radix Select
- **Badge** — status and categorical indicators with semantic variants
- **Card** — structured surface with header, title, description, content, footer
- **Dialog** — accessible modal dialog primitive via Radix Dialog
- **DropdownMenu** — context and action menus with submenus and shortcuts via Radix
- **Tabs** — segmented navigation and content switching via Radix Tabs
- **Pagination** — accessible page links, previous/next buttons, ellipsis
- **AlertDialog** — accessible modal for destructive or confirmation flows
- **Separator** — horizontal and vertical dividers
- **Tooltip** — hover helper overlays via Radix Tooltip
- **Skeleton** — pulse placeholder for content loading
- **Alert** — prominent notification boxes with icon variants
- **DataTable** — TanStack Table wrapper with column sorting and empty states

### Shared Components (`src/components/shared/`)
- **PageHeader** — page title, description, breadcrumbs, action buttons
- **Breadcrumbs** — hierarchical path navigation
- **ConfirmationDialog** — pre-wired modal for destructive or sensitive operations
- **EmptyState** — standardized empty state with icon, message, and CTA
- **ErrorState** — error alert with optional retry action
- **LoadingState** — full-page or inline skeleton loading
- **StatusBadge** — mapped status badges for subscriptions, quotes, and invoices

---

## Feature-Based Folder Architecture (`src/features/`)

All business logic, views, hooks, and sub-components are organized by domain feature:
- `auth/` — Sign in, password reset, session recovery
- `dashboard/` — Admin & Staff operational metrics
- `customers/` — Customer directory, profile, and detail views
- `catalogue/` — Products, variants, and catalogue management
- `plans/` — Subscription plan builder and pricing rules
- `quotations/` — Quote builder, PDF preview, send, and conversion
- `subscriptions/` — Subscription lifecycle, timeline, Control Tower
- `invoices/` — Invoice lists, billing periods, payment status
- `payments/` — Payment recording and invoice allocation
- `discounts/` — Discount rules and redemption tracking
- `reports/` — Normalized MRR/ARR, ageing, and collection reports
- `portal/` — Customer self-service portal
- `settings/` — Workspace settings, staff user administration, numbering
