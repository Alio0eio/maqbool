---
name: EMPO Core
colors:
  surface: '#f9f9ff'
  surface-dim: '#cfdaf2'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eeff'
  surface-container-high: '#dee8ff'
  surface-container-highest: '#d8e3fb'
  on-surface: '#111c2d'
  on-surface-variant: '#444651'
  inverse-surface: '#263143'
  inverse-on-surface: '#ecf1ff'
  outline: '#757682'
  outline-variant: '#c5c5d3'
  surface-tint: '#4059aa'
  primary: '#00236f'
  on-primary: '#ffffff'
  primary-container: '#1e3a8a'
  on-primary-container: '#90a8ff'
  inverse-primary: '#b6c4ff'
  secondary: '#0058be'
  on-secondary: '#ffffff'
  secondary-container: '#2170e4'
  on-secondary-container: '#fefcff'
  tertiary: '#003120'
  on-tertiary: '#ffffff'
  tertiary-container: '#004a32'
  on-tertiary-container: '#4ac08f'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b6c4ff'
  on-primary-fixed: '#00164e'
  on-primary-fixed-variant: '#264191'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a42'
  on-secondary-fixed-variant: '#004395'
  tertiary-fixed: '#85f8c4'
  tertiary-fixed-dim: '#68dba9'
  on-tertiary-fixed: '#002114'
  on-tertiary-fixed-variant: '#005137'
  background: '#f9f9ff'
  on-background: '#111c2d'
  surface-variant: '#d8e3fb'
  surface-bg: '#F8FAFC'
  surface-card: '#FFFFFF'
  surface-subtle: '#F1F5F9'
  text-secondary: '#64748B'
  border-default: '#E2E8F0'
  status-error: '#DC2626'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  headline-xl-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 30px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 24px
  margin: 24px
  container-max: 1280px
---

## Brand & Style

The design system for EMPO is built on the pillars of **Intentionality, Clarity, and Professionalism**. As a recruitment platform, the UI must serve as a reliable bridge between talent and opportunity, requiring an aesthetic that is both high-trust and human-centered.

The chosen style is **Corporate / Modern**, characterized by a systematic approach to information density and a refusal of "trendy" gimmicks. It prioritizes:
- **Utilitarian Elegance:** Every element serves a functional purpose, with aesthetic value derived from precise alignment and balanced proportions.
- **High Information Density:** The layout is optimized for the scanning of resumes, job descriptions, and data tables without inducing cognitive load.
- **Trust-Based Atmosphere:** A cooling palette of professional blues and charcoal grays creates a stable environment for important career decisions.

## Colors

This design system utilizes a high-contrast, professional palette designed for long-form reading and data management.

- **Primary & Secondary:** The core brand identity is anchored in deep Navy (`#1E3A8A`) for authority and Sky Blue (`#3B82F6`) for interactive elements.
- **Surface Strategy:** The system uses a multi-layered light mode. The primary page background is a cool off-white, while interactive components and content containers sit on pure white surfaces to create subtle natural depth.
- **Semantic Feedback:** Success states use a refined Emerald, while error states use a high-visibility Red. Both are calibrated to maintain accessibility standards against the neutral background.
- **Typography Tiers:** Primary text is a deep charcoal (near-black) for maximum legibility, while secondary metadata uses a softer slate gray to establish clear hierarchy.

## Typography

The typography system relies exclusively on **Inter**, a typeface designed for screens and high-readability. 

### Hierarchy & Scale
The scale is designed to manage high-density information. 
- **Headlines:** Use tighter letter spacing and heavier weights to anchor sections.
- **Body Text:** Standardized at 16px for general reading, but utilizes a 14px "Body-MD" for data-heavy views like job listings and sidebars.
- **Labels:** Small labels (12px) should be used for status badges and categories, often paired with a slightly increased font weight and uppercase styling to ensure they remain distinct from body copy.

### Implementation Notes
- Always maintain a line-height of at least 1.5x for body text to ensure readability.
- Headlines should use a 1.2x to 1.3x line-height to keep the visual "block" of the title cohesive.

## Layout & Spacing

This design system employs a **strict 8px grid system** (with 4px increments for micro-adjustments) to ensure a consistent rhythmic flow across all pages.

### Grid Philosophy
- **Fluid Desktop:** A 12-column fluid grid is used for the main content area, with a maximum container width of 1280px. 
- **Gutters & Margins:** A consistent 24px (3 units) gutter and outer margin provides generous whitespace, preventing the UI from feeling cramped despite high information density.
- **Responsive Behavior:** 
  - **Desktop (1024px+):** 12 columns, 24px gutters.
  - **Tablet (768px - 1023px):** 8 columns, 16px gutters.
  - **Mobile (<767px):** 4 columns, 16px gutters, 16px side margins.

### Spacing Rhythm
Use `md` (16px) for standard internal component padding (e.g., inside a card) and `lg` (24px) for the vertical gap between distinct sections or cards in a feed.

## Elevation & Depth

Elevation in the design system is used to signify functional layering rather than stylistic flourish. We use **Tonal Layering** supplemented by **Ambient Shadows**.

- **Level 0 (Surface):** The background (`#F8FAFC`). No shadow.
- **Level 1 (Card):** The primary container for content. Features a subtle 1px border (`#E2E8F0`) and a Low Shadow (1px blur) to provide just enough lift from the background.
- **Level 2 (Interaction):** Hover states for cards or active dropdowns. The shadow increases in blur (4-6px) to indicate the element is "rising" toward the user.
- **Level 3 (Overlay):** Modals and popovers. These use the High Shadow (15px blur) and a semi-transparent dark overlay behind them to focus the user's attention entirely on the task at hand.

Shadow colors are never pure black; they are slightly tinted with the brand's neutral charcoal to keep the shadows feeling "clean" and integrated into the UI.

## Shapes

The shape language is defined by **Soft Geometricism**. 

- **Standard Radius:** 6px-8px (`rounded-md` to `rounded-lg`). This is the default for buttons, input fields, and cards. It offers a modern, approachable feel while maintaining a professional, structured edge.
- **Pill Shapes:** Used exclusively for tags, badges, and status indicators. This distinct shape helps these small elements stand out from the rectangular grid of the rest of the UI.
- **Borders:** All containers (unless full-width mobile) must feature a 1px solid border in the default border color. This defines the structure clearly, even in the absence of shadows.

## Components

### Buttons
- **Primary:** Solid Navy (`#1E3A8A`) with white text. 6px radius.
- **Secondary:** Outline variant with the Primary color for text and border.
- **Tertiary:** Ghost style (text only) used for less prominent actions or navigation.

### Input Fields
- **Default State:** 1px border (`#E2E8F0`), white background, 6px radius.
- **Focus State:** 2px border in Brand Secondary (`#3B82F6`) with a subtle glow or ring.
- **Labels:** Always positioned above the field in `Label-MD` weight.

### Cards
- Standard containers for job posts or candidate profiles.
- 8px radius, white background, Level 1 shadow, and 16px-24px internal padding.
- Headers within cards should be separated by a 1px divider.

### Chips & Badges
- Used for skills or status.
- Pill-shaped with a background that is a 10% opacity version of the semantic color (e.g., light green background for a "Success" badge).

### Lists
- Used for search results. Items should be separated by 1px horizontal rules with clear hover states that subtly change the background color to `#F1F5F9`.