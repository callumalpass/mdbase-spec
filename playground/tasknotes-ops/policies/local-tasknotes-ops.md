---
type: runtime_policy
id: local_tasknotes_ops
name: Local TaskNotes ops policy
runtime: local-mdbase-rs
description: Example local policy for running the TaskNotes ops playground workflows.

grants:
  - capability: github.issue.read
    to: workflow:tasknotes_ops_triage
  - capability: ops.registry.read
    to: workflow:tasknotes_ops_triage
  - capability: ops.registry.write
    to: workflow:tasknotes_ops_triage
  - capability: command.execute
    to: workflow:tasknotes_ops_triage
  - capability: agent.execute
    to: workflow:tasknotes_ops_triage

  - capability: pickle.request.read
    to: workflow:tasknotes_ops_import_approval_responses
  - capability: ops.registry.read
    to: workflow:tasknotes_ops_import_approval_responses
  - capability: ops.registry.write
    to: workflow:tasknotes_ops_import_approval_responses
  - capability: command.execute
    to: workflow:tasknotes_ops_import_approval_responses
  - capability: agent.execute
    to: workflow:tasknotes_ops_import_approval_responses

  - capability: pickle.request.write
    to: workflow:tasknotes_ops_request_closeout_approvals
  - capability: ops.registry.read
    to: workflow:tasknotes_ops_request_closeout_approvals
  - capability: ops.registry.write
    to: workflow:tasknotes_ops_request_closeout_approvals
  - capability: command.execute
    to: workflow:tasknotes_ops_request_closeout_approvals

  - capability: github.issue.write
    to: workflow:tasknotes_ops_apply_approved_closeouts
  - capability: ops.registry.read
    to: workflow:tasknotes_ops_apply_approved_closeouts
  - capability: ops.registry.write
    to: workflow:tasknotes_ops_apply_approved_closeouts
  - capability: command.execute
    to: workflow:tasknotes_ops_apply_approved_closeouts

  - capability: file.read
    to: workflow:tasknotes_release_request_approval
  - capability: file.write
    to: workflow:tasknotes_release_request_approval
  - capability: pickle.request.write
    to: workflow:tasknotes_release_request_approval
  - capability: command.execute
    to: workflow:tasknotes_release_request_approval

  - capability: file.read
    to: workflow:tasknotes_release_handle_approval
  - capability: file.write
    to: workflow:tasknotes_release_handle_approval
  - capability: pickle.request.read
    to: workflow:tasknotes_release_handle_approval
  - capability: command.execute
    to: workflow:tasknotes_release_handle_approval
  - capability: agent.execute
    to: workflow:tasknotes_release_handle_approval

denies: []
---

# Local TaskNotes Ops Policy

This policy grants the capabilities needed by the example workflows, including explicit command execution for the local Tickle migration steps.

This file is only an illustrative policy shape, not a complete sandbox model.
