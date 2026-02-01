---
name: appendix
description: A supplementary appendix to the specification
extends: base-section
display_name_key: title

match:
  path_glob: "appendix-*.md"

fields:
  letter:
    type: string
    required: true
    pattern: "^[a-z]$"
    description: Single lowercase letter identifier (a, b, c, d)
---

# Appendix

A supplementary appendix providing reference material, examples, or formal definitions.
Appendices are identified by letter (A through D) and are non-normative reference material
that supports the main specification chapters.

## Current Appendices

- **A** — Complete examples
- **B** — Expression grammar (formal EBNF)
- **C** — Error codes
- **D** — Compatibility notes
