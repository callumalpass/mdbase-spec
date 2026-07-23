---
type: action
id: approval.request
name: Request approval
provider: approval
materialization: mirror
description: Create a human approval request for a deployment or other high-risk operation.
requires:
  capabilities:
    - approval.request.create
inputSchema:
  type: object
  required: [title, question]
  fields:
    title:
      type: string
    question:
      type: string
    details:
      type: any
    responseSchema:
      type: any
    relatedRecords:
      type: list
      items:
        type: string
outputSchema:
  type: object
  required: [requestId, status]
  fields:
    requestId:
      type: string
    status:
      type: enum
      values: [created, skipped, failed]
effects:
  - approval.request.create
emits:
  - approval.requested
---

# Request Approval

The runtime decides whether this maps to Pickle, a local inbox, Teams, email, GitHub, or another approval surface.
