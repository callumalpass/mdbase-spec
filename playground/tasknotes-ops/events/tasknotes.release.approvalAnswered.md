---
type: event
id: tasknotes.release.approvalAnswered
name: Release approval answered
provider: tasknotes
payloadSchema:
  type: object
  required: [requestId, decision, stateFile]
  fields:
    requestId:
      type: string
    decision:
      type: string
    stateFile:
      type: string
    proposedVersion:
      type: string
---

# Release Approval Answered

Emitted when the release approval request is answered.
