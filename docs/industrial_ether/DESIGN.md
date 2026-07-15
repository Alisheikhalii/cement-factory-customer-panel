---
name: Luminous Industrial Glass
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#4a4454'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#7b7486'
  outline-variant: '#ccc3d7'
  surface-tint: '#7238d5'
  primary: '#380080'
  on-primary: '#ffffff'
  primary-container: '#5300b7'
  on-primary-container: '#bd9cff'
  inverse-primary: '#d3bbff'
  secondary: '#4b41e1'
  on-secondary: '#ffffff'
  secondary-container: '#655dfb'
  on-secondary-container: '#fffbff'
  tertiary: '#4e1a00'
  on-tertiary: '#ffffff'
  tertiary-container: '#722a00'
  on-tertiary-container: '#fa9261'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#eaddff'
  primary-fixed-dim: '#d3bbff'
  on-primary-fixed: '#25005a'
  on-primary-fixed-variant: '#5912bd'
  secondary-fixed: '#e2dfff'
  secondary-fixed-dim: '#c3c0ff'
  on-secondary-fixed: '#0f0069'
  on-secondary-fixed-variant: '#3322cc'
  tertiary-fixed: '#ffdbcc'
  tertiary-fixed-dim: '#ffb595'
  on-tertiary-fixed: '#351000'
  on-tertiary-fixed-variant: '#7a3005'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
  status-success: '#16A34A'
  status-info: '#3B82F6'
  status-warning: '#D97706'
  status-danger: '#DC2626'
  surface-glass: rgba(255, 255, 255, 0.6)
  border-glass: rgba(255, 255, 255, 0.3)
  tertiary-earth: '#6b3000'
typography:
  headline-4xl:
    fontFamily: Vazirmatn
    fontSize: 36px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-3xl:
    fontFamily: Vazirmatn
    fontSize: 30px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-2xl:
    fontFamily: Vazirmatn
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-xl:
    fontFamily: Vazirmatn
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Vazirmatn
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-base:
    fontFamily: Vazirmatn
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-sm:
    fontFamily: Vazirmatn
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
  label-xs:
    fontFamily: Vazirmatn
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.0'
  label-tiny:
    fontFamily: Vazirmatn
    fontSize: 10px
    fontWeight: '700'
    lineHeight: '1.0'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  gap-xs: 8px
  gap-md: 16px
  gap-lg: 24px
  margin-mobile: 16px
  margin-desktop: 32px
  container-max: 1440px
---

## Brand & Style
The brand identity for Hormozgan Cement is "Industrial Sophistication." It balances the heavy, grounded nature of the construction industry with a cutting-edge, transparent digital experience. The style is a refined **Glassmorphism**, utilizing multi-layered translucency, high-performance backdrop blurs, and vibrant gradients to convey clarity and trust. The interface should feel expansive, clean, and highly organized, evoking an emotional response of efficiency and modern reliability.

## Colors
The palette is rooted in a deep "Deep Amethyst" primary and "Electric Indigo" secondary. These are used primarily for active states and brand accents. The background uses a soft linear gradient (`#f7f9fb` to `#e0e3e5`) to provide depth behind glass panels. Status colors are saturated and vibrant to ensure immediate recognition in data-heavy views. Gradients are essential—specifically a 135-degree diagonal flow from primary to secondary—used for key action buttons and significant icon backgrounds.

## Typography
The system uses **Vazirmatn** exclusively to ensure high legibility for Persian/Arabic script while maintaining a modern, geometric feel. Headlines use heavy weights (700+) to establish clear hierarchy against the soft glass backgrounds. Data labels and micro-copy (10px - 12px) are used extensively for KPI metadata and table details, often paired with a slightly increased font weight (600) to maintain readability on translucent surfaces. Monospace variants should be used only for product codes (e.g., PRD-101).

## Layout & Spacing
The layout employs a **Fluid Grid** model with a sidebar-anchored navigation. The main content area utilizes a maximum width of 1440px to prevent excessive line lengths on ultra-wide displays. A modular "Gap" system (8px, 16px, 24px) dictates the relationship between card elements and sections. On mobile devices, the sidebar transitions to a hidden drawer, and horizontal padding reduces to 16px. Tables must support horizontal scrolling on small viewports to preserve data integrity.

## Elevation & Depth
Depth is created through **Glassmorphism layers** rather than traditional opaque shadows. 
- **Level 1 (Base):** Subtle gradient background.
- **Level 2 (Cards/Panels):** `rgba(255, 255, 255, 0.6)` with a `16px` backdrop blur and a `1px` semi-transparent white border.
- **Level 3 (Hover States/Popups):** Increased opacity (`0.8`) and a soft, tinted shadow (`rgba(79, 70, 229, 0.12)`) to indicate interactivity.
The use of "Surface Tint" (primary color at very low opacity) on icon backgrounds adds a layer of branded depth without breaking the glass effect.

## Shapes
The shape language is consistently **Rounded**, reflecting a modern and approachable software aesthetic. Standard containers and cards use a `1rem` (16px) radius. Buttons and input fields use a `0.5rem` (8px) radius, while "Status Pills" and "Search Bars" utilize fully rounded (pill-shaped) geometry. Icons are housed in `12px` rounded squares or full circles depending on their role in the hierarchy.

## Components
- **Buttons:** Primary buttons use a brand gradient (`primary` to `secondary`) with white text and a subtle drop shadow. Secondary buttons are "Glass Cards" with primary-colored text.
- **KPI Cards:** Must include a translucent background, a tinted icon container in the top-right, and a progress indicator or trend sparkline at the bottom.
- **Data Tables:** Headers should be subtly darker (`surface-container-low`) with a bottom border. Row hover states should increase glass opacity.
- **Inputs:** Search and form fields use the `glass-card` style with an `outline-variant` border that intensifies to `primary` on focus.
- **Navigation:** Vertical sidebar uses active states defined by the `primary-container` color and `on-primary-container` text, ensuring high contrast against the blurred background.
- **Status Badges:** Compact labels with 10px bold text, featuring 10% opacity backgrounds and 30% opacity borders of the respective status color.