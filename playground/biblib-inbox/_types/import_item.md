---
name: import_item
description: Queue item for a PDF/EPUB/URL that should become a literature note
display_name_key: title
match:
  path_glob: "inbox/**/*.md"
strict: "warn"
fields:
  id:
    type: string
    required: true
    unique: true
  title:
    type: string
    required: true
  sourcePath:
    type: string
    required: true
  sourceKind:
    type: enum
    values: [pdf, epub, url, doi, isbn, arxiv, manual]
    required: true
  status:
    type: enum
    values: [new, extracting, candidate_found, needs_review, writing, done, failed, ignored]
    default: new
  targetVault:
    type: string
  targetNotePath:
    type: string
  attachmentTargetPath:
    type: string
  detectedIdentifiers:
    type: list
    items:
      type: string
  candidate:
    type: link
    target: metadata_candidate
  reviewQuestion:
    type: link
    target: review_question
  error:
    type: string
  createdAt:
    type: datetime
  updatedAt:
    type: datetime
---

# Import Item

Tracks a watched file or identifier through metadata extraction, review, note creation, and validation.
