---
name: mdbase.dev
description: Minimal technical reference design system for the mdbase specification site.
colors:
  paper: "oklch(100% 0 0)"
  paper-soft: "oklch(100% 0 0)"
  paper-code: "oklch(100% 0 0)"
  ink: "oklch(21% 0.018 255)"
  ink-soft: "oklch(39% 0.016 255)"
  ink-muted: "oklch(54% 0.014 255)"
  line: "oklch(92% 0.006 255)"
  blue-accent: "oklch(45% 0.105 238)"
typography:
  display:
    fontFamily: "Atkinson Hyperlegible, Segoe UI, sans-serif"
    fontSize: "6rem"
    fontWeight: 700
    lineHeight: 0.96
    letterSpacing: "-0.045em"
  headline:
    fontFamily: "Atkinson Hyperlegible, Segoe UI, sans-serif"
    fontSize: "2.5rem"
    fontWeight: 700
    lineHeight: 1.12
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Atkinson Hyperlegible, Segoe UI, sans-serif"
    fontSize: "1.04rem"
    fontWeight: 400
    lineHeight: 1.66
    letterSpacing: "0"
  label:
    fontFamily: "Azeret Mono, SFMono-Regular, Cascadia Code, monospace"
    fontSize: "0.72rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0"
rounded:
  default: "3px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  xxl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.default}"
    padding: "0 24px"
  code-specimen:
    backgroundColor: "{colors.paper-code}"
    textColor: "{colors.ink}"
    rounded: "{rounded.default}"
    padding: "24px"
---

# Design System: mdbase.dev

## 1. Overview

**Creative North Star: "A Clean Standards Document"**

mdbase.dev is a calm, precise reading environment for people who implement the specification. White space, direct typography, pale rules, and real mdbase artifacts give the site its identity. The visual system keeps attention on the model, examples, and normative text.

### Key characteristics

- Open page layouts with generous, deliberate whitespace.
- Strong headings and highly legible long-form text.
- Actual files, schemas, queries, and contracts as the primary visual material.
- One muted blue accent for links and current state.
- Pale horizontal rules for grouping and rhythm.
- Table-like resource rows for dense implementation information.

## 2. Colors

The palette is white with blue-black ink. Hierarchy comes from type, spacing, and pale rules.

### Primary

- **Blue Accent** (`oklch(45% 0.105 238)`): links, version emphasis, selected states, and focus rings.

### Neutral

- **Paper** (`oklch(100% 0 0)`): every page and component surface.
- **Ink** (`oklch(21% 0.018 255)`): headings and primary text.
- **Ink Soft** (`oklch(39% 0.016 255)`): explanatory text.
- **Ink Muted** (`oklch(54% 0.014 255)`): labels and metadata.
- **Line** (`oklch(92% 0.006 255)`): structural dividers.

### Color rule

Use blue for links, focus, and selected states. Keep actions white with restrained outlines or text treatment.

## 3. Typography

**Display and body font:** Atkinson Hyperlegible, with Segoe UI fallback.

**Label and code font:** Azeret Mono, with SFMono-Regular and Cascadia Code fallback.

Atkinson Hyperlegible provides clarity across large headlines and long specification prose. Azeret Mono identifies navigation, versions, file paths, labels, and code.

### Hierarchy

- **Display** (700, up to 6rem desktop / 3.2rem mobile, 0.96): landing hero.
- **Section headline** (700, up to 2.5rem, 1.12): landing and runtime sections.
- **Reader title** (700, up to 3.5rem, 1.12): specification page title.
- **Body** (400, 1.04rem, 1.66): prose with a 72ch maximum measure.
- **Label** (500, 0.7rem to 0.76rem): navigation, metadata, section kickers, and buttons.

### Typography rule

Use the sans face for prose and hierarchy. Reserve mono for structural information and literal technical content.

## 4. Layout and elevation

The system is flat. One-pixel rules establish sections, rows, navigation boundaries, and code surfaces. Page content uses a 64rem maximum width. Landing sections add an 8rem metadata gutter on wide screens, then collapse to a single column below 64rem.

Whitespace carries hierarchy at page scale. Within resource lists and the specification reader, spacing becomes denser to support scanning.

## 5. Components

- **Primary button:** white surface, pale neutral border, ink text, 3px radius, 44px minimum height.
- **Secondary button:** the same light structure with quieter border emphasis.
- **Resource row:** top rule with label, name, description, capabilities, and link aligned in columns.
- **Code specimen:** paper-code surface, fine border, compact mono text, and restrained syntax colors.
- **Spec sidebar link:** blue text with a quiet underline for the selected section.
- **Tablist:** text labels with a blue underline for the selected tab and keyboard arrow support.

## 6. Usage principles

- Lead pages with literal descriptions of the specification or runtime profile.
- Show real collection structures, type definitions, records, and queries.
- Keep reading measures stable and maintain WCAG AA contrast.
- Use cards only when content needs a true contained object boundary.
- Keep hover and focus treatments visible, quiet, and consistent.
- Preserve practical navigation on small screens with an off-canvas specification index.
