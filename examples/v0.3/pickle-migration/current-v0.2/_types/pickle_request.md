---
name: pickle_request
description: Async request that needs a human response.
display_name_key: title
fields:
  id:
    type: string
    generated: ulid
    unique: true
  title:
    type: string
    required: true
  source:
    type: string
  message:
    type: string
  kind:
    type: enum
    values: [approval, choice, input, notice, message]
  status:
    type: enum
    description: Legacy lifecycle marker. Response links are authoritative for answered state.
    values: [pending, answered, cancelled]
  priority:
    type: enum
    values: [low, normal, high, urgent]
  response_type:
    type: string
    required: true
  created_at:
    type: datetime
    generated: now
  due_at:
    type: datetime
  dedupe_key:
    type: string
  tags:
    type: list
    items:
      type: string
  links:
    type: list
    items:
      type: object
      fields:
        label:
          type: string
        url:
          type: string
        path:
          type: string
  attachment_paths:
    type: list
    items:
      type: string
  metadata:
    type: object
  context:
    type: object
    fields:
      cwd:
        type: string
      repo:
        type: string
      task:
        type: string
---
