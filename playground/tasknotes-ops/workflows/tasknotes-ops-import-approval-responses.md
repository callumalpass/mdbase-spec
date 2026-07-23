---
type: workflow
schemaVersion: 1
id: tasknotes_ops_import_approval_responses
name: TaskNotes ops import approval responses
description: Import answered Pickle approvals and run an agent for non-closeout approval decisions.
enabled: true

vars:
  root: /home/calluma/projects/tasknotes
  opsRoot: /home/calluma/projects/tasknotes/.ops
  memory: /home/calluma/.config/tickle/scripts/tasknotes-ops/memory.md

requires:
  capabilities:
    - pickle.request.read
    - ops.registry.read
    - ops.registry.write
    - command.execute
    - agent.execute

triggers:
  - id: every_15m
    type: schedule.interval
    event: schedule.interval.fired
    every: 15m

steps:
  - id: import_responses
    type: command.run
    input:
      command:
        - python
        - /home/calluma/.config/tickle/scripts/tasknotes-ops/pickle-approvals.py
        - import-answered
        - --ops-root
        - "{{vars.opsRoot}}"
      cwd:
        $expr: vars.root
      stdout: json
      timeout: 2m
      result:
        successExitCodes: [0]
        outputPath: "."
      outputSchema:
        type: object
        fields:
          imported:
            type: list
            items:
              type: object
      env:
        TASKNOTES_OPS_ROOT:
          $expr: vars.opsRoot

  - id: handle_responses
    type: agent.run
    if:
      $expr: >
        steps.import_responses.output.selected.imported.filter(value.approval_kind != "closeout").length > 0
    input:
      prompt: "[[tasknotes.ops.approvalResponse]]"
      cwd:
        $expr: vars.root
      memory:
        $expr: vars.memory
      model: gpt-5.5
      maxDuration: 3h
      payload:
        importedApprovals:
          $expr: steps.import_responses.output.selected.imported

run:
  mode: sequential
  concurrency:
    group: workflow
    policy: skip
  limits:
    timeout: 3h
  onError: stop
---

# TaskNotes Ops Import Approval Responses

Equivalent to the current `tasknotes-ops-pickle-responses` Tickle job.

Closeout approvals are imported as sidecar state and left for the deterministic closeout apply workflow.
