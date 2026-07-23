---
type: action
id: review.request
name: Request metadata review
provider: review
materialization: custom
description: Ask a human to resolve ambiguous bibliographic metadata.
requires:
  capabilities:
    - review.request.create
inputSchema:
  type: object
  required: [question]
  fields:
    question:
      type: string
    options:
      type: list
      items:
        type: string
    relatedRecords:
      type: list
      items:
        type: string
outputSchema:
  type: object
  fields:
    requestId:
      type: string
    status:
      type: enum
      values: [created, skipped, failed]
effects:
  - review.request.create
emits:
  - biblib.metadata.reviewRequested
---

# Request Metadata Review

Could map to Pickle, an Obsidian modal, a mobile notification, or a simple markdown review queue.
