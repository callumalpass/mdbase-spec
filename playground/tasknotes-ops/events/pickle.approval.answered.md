---
type: event
id: pickle.approval.answered
name: Pickle approval answered
provider: pickle
payloadSchema:
  type: object
  required: [answeredApprovals]
  fields:
    answeredApprovals:
      type: list
      items:
        type: object
        fields:
          requestId:
            type: string
          sidecar:
            type: string
          approvalKind:
            type: string
          decision:
            type: string
---

# Pickle Approval Answered

Emitted when pending Pickle approvals have received human responses.
