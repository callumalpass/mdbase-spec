---
type: prompt
id: tasknotes.ops.triage
name: TaskNotes ops triage
provider: tasknotes
inputSchema:
  type: object
  required: [dirtyIssues]
  fields:
    dirtyIssues:
      type: object
context:
  include:
    - kind: file
      path: AGENTS.md
    - kind: file
      path: .ops/README.md
    - kind: directory
      path: .ops/items
    - kind: triggerPayload
    - kind: memory
      path: /home/calluma/.config/tickle/scripts/tasknotes-ops/memory.md
output:
  mode: markdown
  artifacts:
    - agent-final-message.md
    - patches
    - screenshots
constraints:
  requireApprovalBefore:
    - landing_bugfix
    - public_action
    - product_direction
  maxDuration: 4h
---

# TaskNotes Ops Triage

Review missing or updated GitHub issues for `callumalpass/tasknotes` and keep `.ops` as the audit trail.

## Required Behavior

1. Read the dirty issue payload first.
2. Seed missing sidecars and refresh dirty GitHub metadata.
3. Triage only the issues identified by the payload unless a related issue is needed to understand the work.
4. Update relevant `.ops/items/*.md` files with analysis, reproduction notes, plans, verification, and draft issue comments.
5. Reproduce bugs with the Obsidian CLI and the test vault when feasible.
6. Do not post GitHub comments, close issues, push, tag, or release without explicit approval.
7. Ask Pickle before landing bugfix candidates, taking public actions, or making product-direction changes.
8. Update durable automation memory before finishing.

## Output Expectations

The agent does not need to return structured domain output. The runtime should capture final message, changed files, run logs, patches, screenshots, and any Pickle request IDs as artifacts/effects.
