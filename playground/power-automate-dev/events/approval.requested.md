---
type: event
id: approval.requested
name: Approval requested
provider: approval
materialization: mirror
description: Emitted when a workflow creates an approval request.
payloadSchema:
  type: object
  required: [requestId, title]
  fields:
    requestId:
      type: string
    title:
      type: string
    relatedRecords:
      type: list
      items:
        type: string
---

# Approval Requested

Useful for UI inboxes, notifications, or audit views.
