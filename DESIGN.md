# Momento Design System

> Inspired by Airbnb — warm coral accent, photography-driven, rounded UI. A B2C marketplace for booking experiences in Malawi.

## 1. Visual Theme

Warm, inviting, premium. White canvases let photography breathe. Pink-coral accent (`#ff385c`) reserved for primary actions. Full-bleed photography at 4:3 with generous rounding (14–20px). Clean typography on white backgrounds — never black-on-black.

## 2. Color Palette

| Token | Value | Usage |
|---|---|---|
| `--color-brand-pink` | `#ff385c` | Primary CTA, active tab, wishlist heart, pricing emphasis |
| `--color-brand-pink-dark` | `#e00b41` | Pressed/active button states |
| `--color-bg-canvas` | `#ffffff` | Page background |
| `--color-bg-soft` | `#f7f7f7` | Footer, secondary sections |
| `--color-border` | `#dddddd` | All 1px borders and dividers |
| `--color-text-primary` | `#222222` | All headings and body text |
| `--color-text-secondary` | `#6a6a6a` | Secondary labels, metadata |
| `--color-text-tertiary` | `#929292` | Disabled, low-priority copy |
| `--color-error` | `#c13515` | Form errors |

## 3. Typography

Font stack: `Circular, -apple-system, system-ui, Roboto, Helvetica Neue, sans-serif`.
Body weight: 500 (not 400). Headings: 700.

| Role | Size | Weight | Line Height |
|---|---|---|---|
| Display | 2.25rem+ | 700 | 1.1 |
| Heading XL | 2rem | 700 | 1.2 |
| Heading LG | 1.5rem | 700 | 1.2 |
| Heading MD | 1.25rem | 600 | 1.2 |
| Heading SM | 1.125rem | 600 | 1.25 |
| Body | 1rem | 500 | 1.25 |
| Body SM | 0.875rem | 500 | 1.29 |
| Caption | 0.75rem | 500 | 1.33 |

## 4. Spacing & Radius

Base unit: 8px. Corner radius scale: 8px (buttons), 14px (card images), 20px (large containers), 50% (avatars, icon buttons).

## 5. Component Patterns

**Cards**: White background, no shadow, 14px image radius, 4:3 aspect ratio, text below image with 4px gaps.
**Primary button**: `#ff385c` background, white text, 8px radius, scale(0.92) on press, 2px `#222222` focus ring.
**Secondary button**: White bg, 1px `#dddddd` border, `#222222` text, 20px pill radius.
**Navbar**: White bg, 1px `#dddddd` bottom border, centered nav, pink active states.
**Search bar**: White bg, 1px `#dddddd` border, 32px pill radius, subtle shadow.

## 6. Elevation

No shadow on listing cards. Stacked layered shadow on modals/booking panels: `rgba(0,0,0,0.02) 0 0 0 1px, rgba(0,0,0,0.04) 0 2px 6px 0, rgba(0,0,0,0.1) 0 4px 8px 0`.

## 7. Responsive

Max content width: 1280px. Grid reflows 4→3→2→1 columns. Nav collapses to bottom tab bar on mobile.
