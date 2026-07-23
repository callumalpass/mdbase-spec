---
type: event
id: biblib.metadata.reviewAnswered
name: Metadata review answered
provider: biblib-inbox
materialization: custom
description: Emitted when a human resolves a bibliographic ambiguity.
payloadSchema:
  type: object
  required: [questionId, questionPath, itemId, answer]
  fields:
    questionId:
      type: string
    questionPath:
      type: string
    itemId:
      type: string
    answer:
      type: string
    answeredAt:
      type: datetime
---

# Metadata Review Answered

Lets a headless workflow resume after human input.
