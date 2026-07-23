---
type: event
id: biblib.metadata.candidateFound
name: Metadata candidate found
provider: biblib-inbox
materialization: custom
description: Emitted when a deterministic or agent step creates a candidate bibliographic record.
payloadSchema:
  type: object
  required: [itemId, itemPath, candidateId, candidatePath, confidence]
  fields:
    itemId:
      type: string
    itemPath:
      type: string
    candidateId:
      type: string
    candidatePath:
      type: string
    confidence:
      type: number
    identifiers:
      type: list
      items:
        type: string
---

# Metadata Candidate Found

High-confidence candidates can proceed to writing. Low-confidence candidates should ask for human review.
