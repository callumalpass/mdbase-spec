---
name: workflow
description: Runtime workflow definition
extends: base_runtime_record
display_name_key: name
match:
  path_glob: "workflows/**/*.md"
strict: "warn"
fields:
  schemaVersion:
    type: integer
    required: true
  materialization:
    type: enum
    values: [virtual, materialized, override]
  vars:
    type: any
  requires:
    type: any
  triggers:
    type: list
    items:
      type: object
      fields:
        id:
          type: string
          required: true
        type:
          type: string
          required: true
    required: true
  conditions:
    type: list
    items:
      type: any
    default: []
  steps:
    type: list
    items:
      type: object
      fields:
        id:
          type: string
          required: true
        type:
          type: string
          required: true
    required: true
  run:
    type: any
---

# Workflow

Declares triggers, conditions, steps, and execution policy. Full semantic validation requires the future workflow validator.
