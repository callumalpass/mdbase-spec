---
type: workflow
schemaVersion: 1
id: tasknotes_ops_apply_approved_closeouts
name: TaskNotes ops apply approved closeouts
description: Apply approved issue closeouts by posting the approved comment, closing the GitHub issue, and updating sidecars.
enabled: true

vars:
  root: /home/calluma/projects/tasknotes
  opsRoot: /home/calluma/projects/tasknotes/.ops

requires:
  capabilities:
    - ops.registry.read
    - ops.registry.write
    - github.issue.write
    - command.execute

triggers:
  - id: every_15m
    type: schedule.interval
    event: schedule.interval.fired
    every: 15m

steps:
  - id: approved
    type: command.run
    input:
      command:
        - python
        - /home/calluma/.config/tickle/scripts/tasknotes-ops/pickle-approvals.py
        - check-approved-closeouts
        - --ops-root
        - "{{vars.opsRoot}}"
      cwd:
        $expr: vars.root
      stdout: json
      timeout: 45s
      result:
        successExitCodes: [0]
        skipExitCodes: [1]
        outputPath: payload
        dedupeKeyPath: event_id

  - id: apply
    type: command.run
    if:
      $expr: steps.approved.output.selected.approved_closeouts.length > 0
    input:
      command:
        - python
        - /home/calluma/.config/tickle/scripts/tasknotes-ops/pickle-approvals.py
        - apply-approved-closeouts
        - --ops-root
        - "{{vars.opsRoot}}"
        - --repo-root
        - "{{vars.root}}"
      cwd:
        $expr: vars.root
      stdout: json
      timeout: 10m
      result:
        successExitCodes: [0]
        outputPath: "."

run:
  mode: sequential
  concurrency:
    group: workflow
    policy: skip
  limits:
    timeout: 10m
  onError: stop
---

# TaskNotes Ops Apply Approved Closeouts

Equivalent to the current `tasknotes-ops-closeout-apply` Tickle job.

The public GitHub write is isolated in one explicit `command.run` step with high-risk capabilities.
