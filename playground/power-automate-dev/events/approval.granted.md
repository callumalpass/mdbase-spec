---
type: event
id: approval.granted
name: Approval granted
provider: approval
materialization: mirror
description: Emitted when a human approves a requested operation.
payloadSchema:
  type: object
  required: [requestId, approvedAt]
  fields:
    requestId:
      type: string
    approvedAt:
      type: datetime
    response:
      type: any
    relatedRecords:
      type: list
      items:
        type: string
---

# Approval Granted

Generic approval event used by the deployment workflow.
