---
name: apple-ui-skills
description: Apple's UI design system. Use when building interfaces inspired by Apple's aesthetic - light mode, Inter font, 4px grid.
license: MIT
metadata:
  author: design-skills
  version: "1.0.0"
  source: https://apple.com
---

# Apple UI Skills

Opinionated constraints for building Apple-style interfaces with AI agents.

## When to Apply

Reference these guidelines when:
- Building light-mode interfaces
- Creating Apple-inspired design systems
- Implementing UIs with Inter font and 4px grid

## Colors

- SHOULD use light backgrounds for primary surfaces
- MUST use `#FFFFFF` as page background (`surface-base`)
- MUST use `#155BD0` for primary actions and focus states (`accent`)
- SHOULD limit color palette to 10 distinct colors
- MUST maintain text contrast ratio of at least 4.5:1 for accessibility

### Semantic Tokens

| Token | HEX | RGB | Usage |
|-------|-----|-----|-------|
| `surface-base` | #FFFFFF | rgb(255,255,255) | Page background |
| `surface-raised` | #0858DC | rgb(8,88,220) | Cards, modals, raised surfaces |
| `text-primary` | #808080 | rgb(128,128,128) | Headings, body text |
| `text-secondary` | #6D89B5 | rgb(109,137,181) | Secondary, muted text |
| `text-tertiary` | #90C5F1 | rgb(144,197,241) | Additional text |
| `border-default` | #B5C7D8 | rgb(181,199,216) | Subtle borders, dividers |
| `accent` | #155BD0 | rgb(21,91,208) | Primary actions, links, focus |

## Typography

- MUST use `Inter` as primary font family
- SHOULD use single font family for consistency
- MUST use `text-balance` for headings and `text-pretty` for body text
- SHOULD use `tabular-nums` for numeric data
- NEVER modify letter-spacing unless explicitly requested

## Spacing

- MUST use 4px grid for spacing
- SHOULD use 4px as default gap between elements
- NEVER use arbitrary spacing values (use design scale)
- SHOULD maintain consistent padding within containers

## Borders

- MUST use border-radius from scale: 20-21px for cards and containers
- SHOULD use 21px+ radius for pill-shaped elements
- MUST use 1px border width consistently
- SHOULD use subtle borders (1px) for element separation

## Layout

- NEVER use `h-screen`, use `min-h-dvh` for full viewport height
- MUST respect `safe-area-inset` for fixed elements
- SHOULD use `size-*` for square elements instead of `w-*` + `h-*`

## Interactive States

- MUST use `2px` outline with accent color
- MUST use `2px` outline-offset
- NEVER remove focus indicators
- MUST use `opacity: 0.5` and `cursor: not-allowed` for disabled elements
- MUST add an `aria-label` to icon-only buttons

## Performance & Motion

- NEVER animate large `blur()` or `backdrop-filter` surfaces
- NEVER apply `will-change` outside an active animation
- MUST animate only compositor props (`transform`, `opacity`)
- Entrance animations <= 200ms with `ease-out`
- Respect `prefers-reduced-motion` and `prefers-reduced-transparency`

