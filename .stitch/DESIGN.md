---
name: Luminous Enterprise
colors:
  surface: '#131317'
  surface-dim: '#131317'
  surface-bright: '#39393d'
  surface-container-lowest: '#0e0e12'
  surface-container-low: '#1b1b1f'
  surface-container: '#1f1f23'
  surface-container-high: '#2a292e'
  surface-container-highest: '#353439'
  on-surface: '#e4e1e7'
  on-surface-variant: '#ccc3d8'
  inverse-surface: '#e4e1e7'
  inverse-on-surface: '#303034'
  outline: '#958da1'
  outline-variant: '#4a4455'
  surface-tint: '#d2bbff'
  primary: '#d2bbff'
  on-primary: '#3f008e'
  primary-container: '#7c3aed'
  on-primary-container: '#ede0ff'
  inverse-primary: '#732ee4'
  secondary: '#c0c1ff'
  on-secondary: '#0f00a9'
  secondary-container: '#2e2ebe'
  on-secondary-container: '#acaeff'
  tertiary: '#adc6ff'
  on-tertiary: '#002e6a'
  tertiary-container: '#0062d2'
  on-tertiary-container: '#dce5ff'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#eaddff'
  primary-fixed-dim: '#d2bbff'
  on-primary-fixed: '#25005a'
  on-primary-fixed-variant: '#5a00c6'
  secondary-fixed: '#e1e0ff'
  secondary-fixed-dim: '#c0c1ff'
  on-secondary-fixed: '#06006c'
  on-secondary-fixed-variant: '#2e2ebe'
  tertiary-fixed: '#d8e2ff'
  tertiary-fixed-dim: '#adc6ff'
  on-tertiary-fixed: '#001a42'
  on-tertiary-fixed-variant: '#004395'
  background: '#131317'
  on-background: '#e4e1e7'
  surface-variant: '#353439'
  border-subtle: '#4a4455'
  glow-violet: '#d2bbff'
  success: '#25d366'
  text-primary: '#ffffff'
  text-secondary: '#94a3b8'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 64px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '800'
    lineHeight: '1.2'
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.0'
    letterSpacing: 0.05em
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.0'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-max: 1440px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 64px
  scale-xs: 0.25rem
  scale-sm: 0.5rem
  scale-md: 1rem
  scale-lg: 1.5rem
  scale-xl: 2.5rem
  scale-2xl: 4rem
---

## Brand & Style

This design system is engineered for MernCrest Solutions, a high-end Enterprise Technology, AI, and Cloud partner. The visual narrative centers on a "Luminous Enterprise" aesthetic—fusing the gravitas of corporate reliability with the cutting-edge energy of next-generation cloud computing.

The design system utilizes a sophisticated **Dark Mode** foundation to evoke a sense of premium precision. The style is a hybrid of **Modern Corporate** and **Glassmorphism**, characterized by:
- **Atmospheric Depth:** Usage of subtle mesh gradients that appear to glow from behind UI surfaces.
- **High Fidelity:** Thin, low-opacity borders and crisp typography that signal meticulous attention to detail.
- **Luminous Accents:** Strategic use of violet light to guide the user's eye toward primary actions and critical data points.

## Colors

The color palette is anchored in a deep-space neutral range to ensure high contrast for the luminous brand elements.

- **Primary Violet (#7c3aed):** Represents innovation and the AI-driven core of the enterprise.
- **Glow Variant (#d2bbff):** Used for "Luminous" effects—outer glows, active states, and focus rings—to simulate light emission.
- **Surface Layering:** The background remains at `#0e0e12`, while elevated "Stitch" components use `#131317`.
- **Accents:** Secondary Indigo and Tertiary Blue provide variety for data visualization and status indicators without diluting the primary brand identity.

## Typography

This design system uses a hierarchical font strategy to balance personality with readability:
- **Display & Headings:** Plus Jakarta Sans provides a modern, approachable geometric feel for all headers.
- **Body & Interface:** Inter is the workhorse for high-density enterprise data and long-form content, chosen for its exceptional legibility at small sizes.
- **Technical Accents:** JetBrains Mono is used for chips, badges, code snippets, and metadata to reinforce the technical/engineering prowess of the brand.

## Layout & Spacing

The layout follows a **Fixed-Fluid Hybrid** model. Content is centered within a maximum container width of 1440px to maintain readability on ultra-wide monitors, while the inner grid remains fluid.

- **Grid System:** A 12-column grid with 24px gutters.
- **Stitch Rhythm:** Sections should be separated by large vertical gaps (`scale-2xl`) to allow the atmospheric mesh gradients room to breathe.
- **Padding:** "StitchCard" components utilize a consistent `scale-lg` (24px) internal padding to maintain an airy, premium feel.

## Elevation & Depth

Depth is achieved through **Tonal Layering** and **Atmospheric Glassmorphism** rather than traditional heavy shadows.

- **Surfaces:** Use `#131317` for card surfaces with a `0.6` opacity backdrop blur (20px) when positioned over mesh gradients.
- **Borders:** Every container must have a subtle `1px` solid border using `#4a4455`. For primary components, use a "Stitch" border—a linear gradient border from `#4a4455` to `#7c3aed` at 45 degrees.
- **Luminous Glow:** Primary active elements should feature a soft, `20px` spread outer glow using `#d2bbff` at `0.15` opacity to simulate light emission.

## Shapes

The design system employs a **Rounded-2XL** language. All major containers, cards, and large buttons use a `1rem` (16px) corner radius. This softness balances the technical nature of the typography, making the enterprise software feel more accessible and modern. Smaller elements like inputs and chips scale down to `0.5rem` (8px).

## Components

- **StitchCard:** The primary container. Must include a `#131317` background, the standard `rounded-2xl` corners, and the subtle `#4a4455` border. For featured content, apply the "luminous" violet border gradient.
- **Buttons:** 
  - *Primary:* Solid `#7c3aed` with a soft violet shadow.
  - *Secondary:* Ghost style with the subtle border and white text.
- **Input Fields:** Dark background (`#0e0e12`), `rounded-lg`, with a `1px` border that transitions to the Primary Violet on focus.
- **Chips (JetBrains Mono):** Use a low-opacity primary violet fill with high-contrast text. These are used for tagging AI models or Cloud regions.
- **StitchHeader:** A sticky navigation component featuring a heavy backdrop blur (`blur-xl`) and a bottom border to delineate the scroll area without creating visual bulk.
- **Mesh Gradients:** Not a component per se, but a required background primitive. Use radial gradients of `#7c3aed` and `#3131c0` at low opacities (10-15%) scattered behind the main content area.
