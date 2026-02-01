---
name: chapter
description: A numbered chapter of the specification (sections 00 through 15)
extends: base-section
display_name_key: title

match:
  path_glob: "[0-9][0-9]-*.md"

fields:
  section:
    type: integer
    required: true
    min: 0
    max: 15
    description: Chapter number (0-15)
  conformance_levels:
    type: list
    items:
      type: integer
    default: []
    description: Which conformance level(s) this chapter contributes to (1-6)
  test_categories:
    type: list
    items:
      type: string
    default: []
    description: Test suite categories that exercise this chapter's requirements
---

# Chapter

A numbered chapter of the MDBase specification. Chapters are numbered 00 through 15 and
form the normative core of the spec.

## Conformance Levels

Each chapter maps to one or more conformance levels:

| Level | Name | Key Chapters |
|-------|------|--------------|
| 1 | Core | 01–05, 07, 09, 12 |
| 2 | Matching | 06 |
| 3 | Querying | 10, 11 |
| 4 | Links | 08 |
| 5 | References | 12 (reference updates) |
| 6 | Full | 13, 15 |

## Test Categories

Values correspond to the categories defined in section 14.3 of the conformance chapter.
