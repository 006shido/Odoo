# Brightloop Design System

## Design Philosophy

Brightloop uses a **premium, restrained, Apple-inspired** visual language. The interface prioritizes clarity, hierarchy, precision, and consistency over decoration.

### Core Principles

1. **Editorial Typography** — Strong hierarchy with Inter font, clear scale from 12px to 36px
2. **Generous Whitespace** — Purposeful spacing that gives content room to breathe
3. **Calm Surfaces** — Warm white/light neutral backgrounds, near-black text
4. **Restrained Accent** — Single indigo accent color used sparingly for primary actions and focus states
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

Based on a 4px grid. Common values:

- `1` = 4px — Tight padding (badge internals)
- `2` = 8px — Inline spacing, icon gaps
- `3` = 12px — Form field gap
- `4` = 16px — Card padding, section gap
- `6` = 24px — Page section spacing
- `8` = 32px — Major section breaks
- `12` = 48px — Page vertical rhythm
- `16` = 64px — Hero spacing

---

## Radii

| Token | Value | Usage |
|---|---|---|
| `sm` | 6px | Badges, small buttons |
| `md` | 8px | Buttons, inputs, cards |
| `lg` | 12px | Dialogs, large cards |
| `xl` | 16px | Hero cards, modals |
| `full` | 9999px | Avatars, pills |

---

## Shadows

| Token | Usage |
|---|---|
| `xs` | Subtle elevation (table headers) |
| `sm` | Cards, dropdown triggers |
| `md` | Dropdowns, popovers |
| `lg` | Dialogs, modals |

---

## Components

### Primitives
- **Button** — default, secondary, outline, ghost, destructive, link variants
- **Input** — text/number/email with border and focus ring
- **Label** — form labels using Radix primitive
- **Select** — dropdown selection using Radix
- **Badge** — status display with semantic colors
- **Card** — content container with header/content/footer
- **Dialog** — modal overlay using Radix
- **Separator** — horizontal/vertical divider
- **Tooltip** — hover information using Radix
- **Skeleton** — loading placeholder with pulse
- **Alert** — informational banners

### Shared
- **PageHeader** — title + description + breadcrumbs + actions
- **Breadcrumbs** — navigation trail with chevron separators
- **StatusBadge** — semantic badge mapping for all business statuses
- **EmptyState** — no-data placeholder with icon + CTA
- **ErrorState** — error display with retry action
- **LoadingState** — page/section loading skeleton
- **DataTable** — TanStack Table wrapper with sorting and empty states

---

## Accessibility

- All interactive elements have visible focus states (`ring-2 ring-accent ring-offset-2`)
- Color contrast meets WCAG 2.2 AA for body text
- All form controls have associated labels
- Dialogs trap focus and support Escape to close
- Motion respects `prefers-reduced-motion`
- Keyboard navigation supported throughout

