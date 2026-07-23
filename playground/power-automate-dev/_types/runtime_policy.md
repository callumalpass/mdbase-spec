---
name: runtime_policy
description: Local runtime capability policy
extends: base_runtime_record
display_name_key: id
match:
  path_glob: "policies/**/*.md"
strict: "warn"
fields:
  runtime:
    type: string
    required: true
  grants:
    type: list
    items:
      type: object
      fields:
        capability:
          type: string
          required: true
        to:
          type: string
          required: true
    default: []
  denies:
    type: list
    items:
      type: object
      fields:
        capability:
          type: string
          required: true
        to:
          type: string
          required: true
    default: []
---

# Runtime Policy

Declares local grants and denials for a runtime.
