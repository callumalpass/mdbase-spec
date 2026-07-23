---
name: metadata_candidate
description: Candidate bibliographic metadata for an import item
display_name_key: title
match:
  path_glob: "candidates/**/*.md"
strict: "warn"
fields:
  id:
    type: string
    required: true
    unique: true
  importItem:
    type: link
    target: import_item
    validate_exists: true
    required: true
  title:
    type: string
    required: true
  confidence:
    type: number
  status:
    type: enum
    values: [draft, accepted, rejected, needs_review, written]
    default: draft
  identifiers:
    type: list
    items:
      type: string
  csl:
    type: any
  evidence:
    type: list
    items:
      type: object
      fields:
        source:
          type: string
        value:
          type: string
        confidence:
          type: number
  proposedNotePath:
    type: string
  proposedAttachmentPath:
    type: string
  notes:
    type: string
---

# Metadata Candidate

Stores what the runtime or agent thinks the bibliographic record should be, plus evidence and confidence.
