---
name: mdbase.dev
description: Technical field-manual design system for the mdbase specification site.
colors:
  ink-bg: "oklch(16% 0.015 165)"
  ink-elevated: "oklch(20% 0.018 165)"
  ink-panel: "oklch(23% 0.02 165)"
  parchment-text: "oklch(84% 0.026 82)"
  parchment-bright: "oklch(94% 0.018 82)"
  amber-accent: "oklch(73% 0.14 72)"
  mint-code: "oklch(74% 0.095 158)"
  cyan-link: "oklch(73% 0.095 220)"
typography:
  display:
    fontFamily: "Azeret Mono, Menlo, Consolas, monospace"
    fontSize: "3.7rem"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "0"
  headline:
    fontFamily: "Azeret Mono, Menlo, Consolas, monospace"
    fontSize: "1.65rem"
    fontWeight: 600
    lineHeight: 1.22
    letterSpacing: "0"
  body:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: "0"
  label:
    fontFamily: "Azeret Mono, Menlo, Consolas, monospace"
    fontSize: "0.82rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0"
rounded:
  sm: "3px"
  md: "6px"
  lg: "8px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  xxl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.amber-accent}"
    textColor: "{colors.ink-bg}"
    rounded: "{rounded.md}"
    padding: "0 32px"
  card:
    backgroundColor: "{colors.ink-elevated}"
    textColor: "{colors.parchment-text}"
    rounded: "{rounded.lg}"
    padding: "24px"
---

# Design System: mdbase.dev

## 1. Overview

**Creative North Star: "The Typed Field Manual"**

mdbase.dev should feel like a carefully maintained technical manual for people who build tools, not a startup product page. The system is dark because it evokes editor and terminal contexts, but the contrast, serif body copy, and warmer text palette keep long-form reading humane.

The design rejects generic SaaS chrome, decorative terminal cosplay, and dark surfaces that hide content. Visual interest comes from actual mdbase artifacts: type files, folder structure, query snippets, conformance levels, and implementation resources.

**Key Characteristics:**

- Manual-like density with clear reading rhythm.
- Concrete code and filesystem specimens as imagery.
- Amber for primary action and versioning, mint/cyan/violet for code semantics.
- Flat, bordered surfaces instead of heavy shadows or nested cards.

## 2. Colors

The palette is a restrained technical field palette: green-black ink surfaces, warm parchment text, amber action, and small semantic accents for code.

### Primary

- **Amber Accent** (`oklch(73% 0.14 72)`): primary CTAs, version tags, active states, and the most important navigational highlights.

### Secondary

- **Mint Code** (`oklch(74% 0.095 158)`): positive code semantics and implementation feature markers.
- **Cyan Link** (`oklch(73% 0.095 220)`): focus rings and secondary technical emphasis.

### Neutral

- **Ink Background** (`oklch(16% 0.015 165)`): page background, tinted away from pure black.
- **Ink Elevated** (`oklch(20% 0.018 165)`): cards and raised panels.
- **Parchment Text** (`oklch(84% 0.026 82)`): default readable text.
- **Parchment Bright** (`oklch(94% 0.018 82)`): headings and strongest emphasis.

### Named Rules

**The Proof-First Color Rule.** Use color to identify real artifacts and current state. Do not use accent color as decoration when no user meaning changes.

## 3. Typography

**Display Font:** Azeret Mono, with Menlo and Consolas fallback.
**Body Font:** Source Serif 4, with Georgia fallback.
**Label/Mono Font:** Azeret Mono.

**Character:** The pairing keeps headings mechanical and implementation-oriented while body copy stays readable across the long spec. Mono is for structure, labels, file paths, and code-adjacent headings; serif carries explanation.

### Hierarchy

- **Display** (700, 3.7rem desktop / 2.42rem mobile, 1.05): landing hero only.
- **Headline** (600, 1.65rem, 1.22): section headings and major reader headings.
- **Title** (600, 1rem-1.08rem, 1.22): card titles and local headings.
- **Body** (400, 1rem, 1.7): specification prose with a 68ch maximum measure.
- **Label** (600, 0.78rem-0.82rem, 1.3): section kickers, nav labels, tags, and card metadata.

### Named Rules

**The Mono Budget Rule.** Mono can frame and identify, but prose should remain serif unless the content is code, file paths, or navigation.

## 4. Elevation

The system is mostly flat. Depth comes from tonal layering, borders, and rare page-level shadows on mobile drawers. Cards should use full borders and 8px-or-smaller radius. Avoid side stripes, glass effects, and stacked cards.

## 5. Components

- **Primary button:** amber fill, ink text, 6px radius, minimum 48px height.
- **Ghost button:** translucent ink panel with full border, used for secondary external actions.
- **Card/resource tile:** ink-elevated background, full border, 8px radius, no empty filler cells.
- **Code specimen:** dark ink code panel with semantic mint/cyan/violet/amber highlighting.
- **Spec sidebar link:** full bordered active state, never a colored side stripe.
- **Tablist:** true ARIA tabs with roving tabindex, selected fill, and keyboard arrow support.

## 6. Do's and Don'ts

Do show real folders, type definitions, records, queries, and conformance language early.

Do maintain WCAG AA contrast for all meaningful text, including nav and metadata.

Do keep the spec reader stable and efficient for long sessions.

Don't use blank card-grid cells as structural dividers.

Don't make the hero a generic split card layout or a vague technical slogan.

Don't rely on hover-only affordances for navigation or deep links.
