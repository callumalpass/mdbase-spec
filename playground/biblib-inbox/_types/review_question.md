---
name: review_question
description: Human review question for ambiguous bibliographic metadata
display_name_key: title
match:
  path_glob: "review-questions/**/*.md"
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
  status:
    type: enum
    values: [open, answered, cancelled]
    default: open
  question:
    type: string
    required: true
  options:
    type: list
    items:
      type: string
  answer:
    type: string
  answeredAt:
    type: datetime
---

# Review Question

Used when metadata is ambiguous and the runtime should ask a human instead of guessing.
