---
type: event
id: filesystem.file.moved
name: File moved
provider: mdbase-runtime
materialization: mirror
description: Emitted after a runtime moves a source file into its final attachment location.
payloadSchema:
  type: object
  required: [from, to]
  fields:
    from:
      type: string
    to:
      type: string
    movedAt:
      type: datetime
---

# File Moved

Used for audit and loop prevention.
