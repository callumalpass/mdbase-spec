---
type: event
id: approval.rejected
name: Approval rejected
provider: approval
materialization: mirror
description: Emitted when a human rejects a requested operation.
payloadSchema:
  type: object
  required: [requestId, rejectedAt]
  fields:
    requestId:
      type: string
    rejectedAt:
      type: datetime
    response:
      type: any
    relatedRecords:
      type: list
      items:
        type: string
---

# Approval Rejected

Generic rejection event.
