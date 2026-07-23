---
type: event
id: mdbase.validation.failed
name: mdbase validation failed
provider: mdbase
materialization: mirror
description: Emitted when a created or updated record fails mdbase validation.
payloadSchema:
  type: object
  required: [path, errors]
  fields:
    path:
      type: string
    errors:
      type: list
      items:
        type: any
    type:
      type: string
---

# Validation Failed

Can trigger an agent repair attempt or a human review question.
