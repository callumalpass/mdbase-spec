---
type: event
id: ops.closeout.approved
name: Closeout approved
provider: ops
payloadSchema:
  type: object
  required: [approvedCloseouts]
  fields:
    approvedCloseouts:
      type: list
      items:
        type: object
        fields:
          sidecar:
            type: string
          repo:
            type: string
          number:
            type: integer
          closeReason:
            type: string
---

# Closeout Approved

Emitted when issue closeout approvals are ready to apply.
