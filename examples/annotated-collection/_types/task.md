---
name: task
description: Task record linked to a project
fields:
  id:
    type: string
    required: true
    pattern: "^task-[0-9]{3}$"
    unique: true
  title:
    type: string
    required: true
    min_length: 1
  status:
    type: enum
    values: [open, in_progress, done]
    default: open
  priority:
    type: integer
    min: 1
    max: 5
    default: 3
  project:
    type: link
    validate_exists: true
---

# task type

Used by `tasks/*.md`.
