---
name: project
description: Project record
fields:
  id:
    type: string
    required: true
    pattern: "^proj-[a-z0-9-]+$"
    unique: true
  title:
    type: string
    required: true
    min_length: 1
  status:
    type: enum
    values: [active, paused, done]
    default: active
  created_at:
    type: datetime
    generated: now
---

# project type

Used by `projects/*.md`.
