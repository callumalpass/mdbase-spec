---
name: base-section
description: Shared fields for all specification sections (chapters and appendices)

fields:
  id:
    type: string
    required: true
    unique: true
    description: Unique identifier used for link resolution (e.g., "03-frontmatter")
  title:
    type: string
    required: true
    description: Human-readable section title
  description:
    type: string
    description: One-line summary of what this section covers
  status:
    type: enum
    values: [draft, review, stable]
    default: stable
    description: Editorial status of this section
  normative:
    type: boolean
    default: true
    description: Whether this section defines normative requirements (false for overview/meta sections)
  depends_on:
    type: list
    items:
      type: link
    default: []
    description: Other spec sections this section references or builds upon
---

# Base Section

Abstract parent type for all specification sections. Not intended for direct use —
extend with `chapter` or `appendix`.

## Fields

- **id**: Set explicitly in frontmatter. Used for wikilink resolution (e.g., `[[03-frontmatter]]`).
- **title**: The section heading as it appears in the document.
- **description**: A brief summary suitable for tables and indexes.
- **status**: Editorial lifecycle. Most sections are `stable`; use `draft` or `review` for work in progress.
- **normative**: Set to `false` for introductory or meta-structural sections like the Overview.
- **depends_on**: Links to prerequisite sections. Enables dependency queries like "what must I read before this chapter?"
