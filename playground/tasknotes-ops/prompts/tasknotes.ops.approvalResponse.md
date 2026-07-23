---
type: prompt
id: tasknotes.ops.approvalResponse
name: TaskNotes ops approval response
provider: tasknotes
inputSchema:
  type: object
  required: [importedApprovals]
  fields:
    importedApprovals:
      type: list
      items:
        type: object
context:
  include:
    - kind: triggerPayload
    - kind: importedResponses
    - kind: directory
      path: .ops/items
    - kind: memory
      path: /home/calluma/.config/tickle/scripts/tasknotes-ops/memory.md
output:
  mode: markdown
  artifacts:
    - agent-final-message.md
constraints:
  requireCandidateMatchFor:
    - bugfix
  maxDuration: 3h
---

# TaskNotes Ops Approval Response

Process answered Pickle approvals for TaskNotes `.ops`.

## Decision Policy

- `approve`: continue with the approved bugfix landing, feature, public action, or scope change if it still matches the approved request and current repo state.
- `revise`: follow the human comment or ask a narrower follow-up question.
- `reject`: do not implement the action. Update the sidecar and keep any public comment as a draft only.
- `snooze`: preserve the draft, record `review_after`, and take no public action.

For closeout approvals, only an imported `approve` should lead to a public GitHub action, and the deterministic closeout workflow should post the exact stored draft comment.
