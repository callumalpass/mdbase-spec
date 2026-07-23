---
type: event
id: tasknotes.release.thresholdReached
name: Release threshold reached
provider: tasknotes
payloadSchema:
  type: object
  required: [issueCount, threshold, issues, contentHash]
  fields:
    issueCount:
      type: integer
    threshold:
      type: integer
    issues:
      type: list
      items:
        type: integer
    contentHash:
      type: string
---

# Release Threshold Reached

Emitted when `docs/releases/unreleased.md` contains enough issue-backed changes to request release approval.
