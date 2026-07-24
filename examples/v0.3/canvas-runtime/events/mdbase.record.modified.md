---
type: event
id: mdbase.record.modified
version: 1
provider: mdbase
name: Record modified
description: Emitted after a record frontmatter update succeeds.

schemas:
  dialect: json-schema-2020-12
  payload:
    type: object
    required: [path, types]
    additionalProperties: false
    properties:
      path:
        type: string
      types:
        type: array
        items:
          type: string
      previous_types:
        type: array
        items:
          type: string
      before:
        type: object
        additionalProperties: true
      after:
        type: object
        additionalProperties: true
      changed_fields:
        type: array
        items:
          type: string
      previous_revision:
        type: string
      revision:
        type: string
---

# Record modified

Standard event emitted by write-capable runtimes after a record patch.
