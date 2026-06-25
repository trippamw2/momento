# Experio Design System

> Dark mode, premium feel, spec-driven. #FF2D7A → #FF7A18 gradient anchors the brand identity. Near-black backgrounds with glassmorphism and ambient glow create depth. Photography takes center stage with full-bleed hero images. The signature Experio gradient flows from pink (#FF2D7A) to orange (#FF7A18).

## 1. Visual Theme

Dark, moody, premium. Spec calls for nocturnal elegance — deep near-black backgrounds (#05070B) with subtle glass overlays and vibrant accent gradients. The experience is cinematic: dark canvases let photography and the brand gradient pop. 20px radius is the default corner rounding.

## 2. Color Palette

### Brand Colors
| Token | Value | Usage |
|---|---|---|
| `--color-brand-primary` | `#FF2D7A` | Primary CTA, active tab, pricing emphasis |
| `--color-brand-secondary` | `#FF7A18` | Secondary actions, warm accents |
| `--color-brand-pink` | `#FF2D7A` | Legacy alias for primary |
| `--color-brand-orange` | `#FF7A18` | Legacy alias for secondary |
| `--color-brand-pink-dark` | `#cc2461` | Pressed/active button states |
| `--color-brand-orange-dark` | `#cc6213` | Pressed warm button states |
| `--color-surface-primary` | `#05070B` | Page background |
| `--color-surface-secondary` | `#0A0E17` | Elevated panels, hero fallback |
| `--color-surface-tertiary` | `#111827` | Cards, inputs, secondary sections |
| `--color-surface-elevated` | `#1A2332` | Hover states, active cards |
| `--color-border-default` | `rgba(255,255,255,0.1)` | All 1px borders and dividers |
| `--color-border-subtle` | `rgba(255,255,255,0.06)` | Very subtle borders |
| `--color-text-primary` | `#FFFFFF` | All headings and body text |
| `--color-text-secondary` | `#CBD5E1` | Secondary labels, metadata |
| `--color-text-tertiary` | `#94A3B8` | Disabled, low-priority copy |

### Gradient Palette
| Name | Colors | Usage |
|---|---|---|
| Brand | #FF2D7A → #FF7A18 | Primary buttons, hero text, brand banners |
| Warm (reversed) | #FF7A18 → #FF2D7A | Warm CTAs, seasonal sections |

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

Base unit: 4px. Corner radius scale: 8px (pill variant), 12px (buttons), 16px (modals), 20px (default, cards, large containers), 28px (featured), 9999px (full pill).

**20px radius is the default** — applied to cards, buttons, inputs, and containers.

## 5. Component Patterns

**Cards**: Dark background (#111827), 20px radius, optional glass variant (rgba(17,24,39,0.8) backdrop-blur), gradient overlays on images. Bottom content with title, rating, price in white/slate text.

**Primary button**: #FF2D7A background, white text, 20px radius, glow shadow (`0 4px 16px rgba(255,45,122,0.25)`) on hover.

**Secondary button**: #111827 bg, 1px white/[0.1] border, white text, 20px radius.

**Navbar**: Glass-nav background (rgba(5,7,11,0.9) backdrop-blur), 1px rgba(255,255,255,0.06) bottom border, #FF2D7A accent on active states.

**Search bar/Input**: #111827 bg, 1px white/[0.1] border, 20px radius, subtle shadow. Focus ring: #FF2D7A with glow.

**Image Gallery (Detail Page)**: Full-screen swipeable carousel with thumbnail strip. Dark backgrounds let images pop. Tap/drag to navigate between images.

**Glass Card**: `rgba(17, 24, 39, 0.8)` background, `backdrop-filter: blur(20px)`, 1px `rgba(255,255,255,0.06)` border, 20px radius.

**Hero Section**: Full-viewport background image at 25-35% opacity, gradient overlays from #05070B, subtle #FF2D7A/#FF7A18 ambient glow. Mood grid with dark pill cards (#111827 bg, white/[0.1] border).

**Mood Pills**: 6 moods with emojis — Romantic ❤️, Relax 😌, Celebrate 🎉, Escape 🌴, Treat Myself ✨, Food & Drink 🍽. Each pill: #111827 background, white/[0.1] border, white emoji + label, hover glow effect.

## 6. Elevation

Dark-mode shadows: `0 2px 8px rgba(0,0,0,0.4)` on cards. Elevated cards (hover): `0 4px 16px rgba(0,0,0,0.5)`. Brand glow on primary buttons: `0 4px 16px rgba(255,45,122,0.25)`. Modals: `0 8px 32px rgba(0,0,0,0.5)`. Glass effect with backdrop-blur replaces heavy shadows.

## 7. Responsive

Max content width: 1280px. Grid reflows 4→3→2→1 columns. ContentRail scrolls horizontally with snap scroll. Discovery Feed full-viewport snap with mobile-optimized bottom sheet. Nav collapses to hamburger on mobile (<768px). Detail page sidebar stacks below content on mobile.
