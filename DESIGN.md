# Experio Design System

> Inspired by Instagram — vibrant gradients, bold typography, and social-first UI. A B2C marketplace for booking experiences in Malawi.

## 1. Visual Theme

Vibrant, energetic, bold. Instagram-inspired gradient palette anchors the brand identity. White canvases with ambient gradient glows create depth. Photography takes center stage with full-bleed hero images. The signature Experio gradient flows from pink (#DD2A7B) → purple (#8134AF) → blue (#515BD4), with warm variations using yellow (#FEDA77) → orange (#F58529) → pink.

## 2. Color Palette

### Brand Colors
| Token | Value | Usage |
|---|---|---|
| `--color-brand-pink` | `#DD2A7B` | Primary CTA, active tab, wishlist heart, pricing emphasis |
| `--color-brand-pink-dark` | `#b81d6a` | Pressed/active button states |
| `--color-brand-purple` | `#8134AF` | Secondary actions, accent badges |
| `--color-brand-orange` | `#F58529` | Warm accents, seasonal campaigns |
| `--color-brand-yellow` | `#FEDA77` | Highlight, star ratings warmth |
| `--color-brand-blue` | `#515BD4` | Tertiary accent, links, info |
| `--color-bg-canvas` | `#ffffff` | Page background |
| `--color-bg-soft` | `#f7f7f7` | Footer, secondary sections |
| `--color-border` | `#dddddd` | All 1px borders and dividers |
| `--color-text-primary` | `#222222` (→ `#111111`) | All headings and body text |
| `--color-text-secondary` | `#4a4a4a` | Secondary labels, metadata |
| `--color-text-tertiary` | `#929292` | Disabled, low-priority copy |
| `--color-error` | `#c13515` | Form errors |

### Gradient Palette
| Name | Colors | Usage |
|---|---|---|
| Brand | #DD2A7B → #8134AF → #515BD4 | Primary buttons, hero sections, brand banners |
| Sunset | #FEDA77 → #F58529 → #DD2A7B | Warm CTAs, seasonal, gift sections |
| Warm | #F58529 → #DD2A7B → #8134AF | Secondary gradients, mood badges |
| Secondary | #8134AF → #515BD4 | Subtle accents, info cards |

## 3. Typography

Font stack: `Geist, -apple-system, system-ui, Roboto, Helvetica Neue, sans-serif`.
Headings use `Playfair Display` (serif) for luxury/editorial sections.

| Role | Size | Weight | Line Height |
|---|---|---|---|
| Display | 2.25rem+ | 700 | 1.1 |
| Heading XL | 2rem | 700 | 1.2 |
| Heading LG | 1.5rem | 700 | 1.2 |
| Heading MD | 1.25rem | 600 | 1.2 |
| Heading SM | 1.125rem | 600 | 1.25 |
| Body | 1rem | 400 | 1.5 |
| Body SM | 0.875rem | 400 | 1.5 |
| Caption | 0.75rem | 500 | 1.33 |

## 4. Spacing & Radius

Base unit: 4px. Corner radius scale: 8px (buttons), 12px (cards), 16px (modals), 20px (large containers), 9999px (pills, avatars).

## 5. Component Patterns

**Cards**: White background, 12px image radius, 3:4 aspect ratio for experience cards, gradient overlays on images. Logo badge top-right corner on cards. Bottom content with mood tag, rating, title, price.

**Primary button**: Instagram gradient (#DD2A7B → #8134AF → #515BD4) background, white text, 12px radius, glow shadow on hover.

**Secondary button**: White bg, 1px #dddddd border, #222222 text, 20px pill radius.

**Navbar**: Glass background (bg-white/90 backdrop-blur), 1px #ebebeb bottom border, gradient brand accent on active states.

**Search bar**: White bg, 1px #dddddd border, 12px radius, subtle shadow.

**Image Gallery (Detail Page)**: Full-screen swipeable carousel with thumbnail strip. Instagram Stories-style progress indicators. Tap/drag to navigate between images.

## 6. Elevation

Subtle shadows on cards: `0 1px 3px rgba(0,0,0,0.06)`. Elevated cards (hover): `0 8px 32px rgba(0,0,0,0.08)`. Brand glow on primary buttons: `0 4px 16px rgba(221,42,123,0.25)`. Modals: layered shadow with `0 8px 32px rgba(0,0,0,0.12)`.

## 7. Responsive

Max content width: 1280px. Grid reflows 4→3→2→1 columns. ContentRail scrolls horizontally with snap scroll. Discovery Feed full-viewport snap with mobile-optimized bottom sheet. Nav collapses to hamburger on mobile (<768px). Detail page sidebar stacks below content on mobile.
