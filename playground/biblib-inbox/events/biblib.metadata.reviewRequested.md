---
type: event
id: biblib.metadata.reviewRequested
name: Metadata review requested
provider: biblib-inbox
materialization: custom
description: Emitted when a workflow creates a review question for ambiguous metadata.
payloadSchema:
  type: object
  required: [requestId]
  fields:
    requestId:
      type: string
    relatedRecords:
      type: list
      items:
        type: string
---

# Metadata Review Requested

Useful for notification surfaces.
