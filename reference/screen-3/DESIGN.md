---
name: Radiant Ethereal
colors:
  surface: '#fbf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fbf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae8e7'
  surface-container-highest: '#e4e2e1'
  on-surface: '#1b1c1c'
  on-surface-variant: '#4d4447'
  inverse-surface: '#303030'
  inverse-on-surface: '#f3f0f0'
  outline: '#7f7478'
  outline-variant: '#d0c3c7'
  surface-tint: '#6b5a60'
  primary: '#6b5a60'
  on-primary: '#ffffff'
  primary-container: '#fce4ec'
  on-primary-container: '#76646b'
  inverse-primary: '#d7c1c8'
  secondary: '#ab2c5d'
  on-secondary: '#ffffff'
  secondary-container: '#fd6c9c'
  on-secondary-container: '#6e0034'
  tertiary: '#735c00'
  on-tertiary: '#ffffff'
  tertiary-container: '#ffe8ad'
  on-tertiary-container: '#806600'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#f4dce4'
  primary-fixed-dim: '#d7c1c8'
  on-primary-fixed: '#25181e'
  on-primary-fixed-variant: '#524249'
  secondary-fixed: '#ffd9e1'
  secondary-fixed-dim: '#ffb1c5'
  on-secondary-fixed: '#3f001b'
  on-secondary-fixed-variant: '#8b0e45'
  tertiary-fixed: '#ffe088'
  tertiary-fixed-dim: '#e9c349'
  on-tertiary-fixed: '#241a00'
  on-tertiary-fixed-variant: '#574500'
  background: '#fbf9f8'
  on-background: '#1b1c1c'
  surface-variant: '#e4e2e1'
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 64px
    fontWeight: '700'
    lineHeight: 72px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
  headline-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-md:
    fontFamily: Playfair Display
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  body-lg:
    fontFamily: Montserrat
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Montserrat
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Montserrat
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  button:
    fontFamily: Montserrat
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: 0.1em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 20px
  margin-desktop: 60px
---

## Brand & Style
The design system embodies a "Modern Romantic" aesthetic, blending the tactile luxury of traditional high-end skincare with digital-first transparency. The target audience seeks a premium, self-care ritual that feels both scientifically advanced and emotionally nurturing.

The visual language utilizes **Glassmorphism** to create a sense of lightness and depth, mimicking the translucency of healthy skin and premium glass packaging. This is grounded by a refined **Minimalist** structure to ensure high conversion and clarity. The emotional response should be one of "aspirational calm"—the user feels they have entered a serene, expert-led boutique where every interaction is smooth and intentional.

## Colors
The palette is rooted in a tonal range of pinks to evoke femininity and softness, contrasted with deep charcoal for absolute legibility.

- **Primary & Surface:** Ivory White (#FFFFF0) serves as the canvas, providing a warmer, more premium feel than pure white. Soft Blush (#FCE4EC) is used for large background sections and subtle UI containers.
- **Accents:** Rose Pink (#F06292) is reserved for primary actions and highlights. Metallic Gold (#D4AF37) is used sparingly for decorative accents, iconography, and high-tier "Premium" indicators.
- **Text:** Deep Charcoal (#333333) ensures high contrast against the pastel backgrounds, maintaining an authoritative and trustworthy voice.

## Typography
The typography system relies on a high-contrast pairing: 
- **Headlines:** Playfair Display provides an editorial, fashion-forward tone. Use "display-lg" for hero sections and "headline-lg" for product categories.
- **Body & Labels:** Montserrat is used for functional clarity. Its geometric nature provides a modern counterpoint to the traditional serif. 
- **Styling:** Use uppercase with increased letter spacing for "label-md" and "button" roles to emphasize the luxury branding.

## Layout & Spacing
The layout follows a **fluid grid** model with generous white space to allow product imagery to breathe.

- **Desktop:** 12-column grid with 60px side margins. Use wide gutters (24px) to maintain a feeling of unhurried luxury.
- **Mobile:** 4-column grid with 20px side margins. 
- **Spacing Rhythm:** Use increments of 8px. Elements should be grouped using 16px/24px spacing, while major sections should be separated by 80px/120px to create distinct visual "chapters" in the user journey.

## Elevation & Depth
Depth is achieved through **Glassmorphism** and soft, colored shadows rather than harsh greyscale shadows.

- **Glass Layers:** Use a background blur of 12px–20px on containers with a 60% opaque Ivory White fill. Add a 1px solid white border at 20% opacity to define the edges.
- **Shadows:** Use "Rose Shadows"—diffused blurs with a tiny hint of the #F06292 hue (e.g., `rgba(240, 98, 146, 0.08)`) to maintain the warmth of the palette.
- **Z-Index:** Hero elements and floating product cards should feel like they are floating on a soft bed of light.

## Shapes
The design system utilizes **Pill-shaped** and highly rounded geometry to evoke the organic curves of the human form and beauty packaging. 

- **Primary Cards:** Use a minimum radius of 24px. 
- **Buttons:** Fully pill-shaped (rounded-full) for a soft, touchable feel.
- **Inputs:** 12px radius to balance softness with the precision required for form entry.
- **Imagery:** Product photography should either be full-bleed or contained within 32px rounded frames.

## Components
- **Buttons:** Primary buttons use a Rose Pink (#F06292) fill with white uppercase text. Secondary buttons use a Glassmorphic style with a Gold (#D4AF37) border.
- **Input Fields:** Soft Ivory background with a subtle Rose shadow on focus. Labels sit above the field in uppercase Montserrat.
- **Product Cards:** Featuring the signature Glassmorphic style with 24px rounded corners. Include a "Quick Add" floating button that appears on hover.
- **Chips/Badges:** Small, pill-shaped tags used for "Vegan," "Cruelty-Free," or "Award Winner," using a Gold (#D4AF37) outline.
- **Gradients:** Use a linear gradient from #FCE4EC to #FFFFF0 at a 45-degree angle for sectional backgrounds to guide the eye downward.
- **Interactive Gold:** Use a subtle metallic shimmer effect (CSS linear-gradient with highlights) for "Order Now" or "Exclusive" call-to-actions to signify value.