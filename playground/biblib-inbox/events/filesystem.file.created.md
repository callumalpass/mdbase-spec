---
type: event
id: filesystem.file.created
name: File created
provider: mdbase-runtime
materialization: mirror
description: Emitted when the runtime sees a new file in a watched path.
payloadSchema:
  type: object
  required: [path, extension]
  fields:
    path:
      type: string
    extension:
      type: string
    size:
      type: integer
    createdAt:
      type: datetime
    source:
      type: string
---

# File Created

System-level event adapted by the runtime. The vault is not the scheduler or watcher; it is the durable control plane.
