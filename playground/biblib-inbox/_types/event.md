---
name: event
description: Runtime event contract
extends: base_runtime_record
display_name_key: id
match:
  path_glob: "events/**/*.md"
strict: "warn"
fields:
  materialization:
    type: enum
    values: [mirror, annotate, override, custom]
  payloadSchema:
    type: any
  emits:
    type: list
    items:
      type: string
---

# Event

Defines an event ID and payload shape.
