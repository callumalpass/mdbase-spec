---
type: workflow
schemaVersion: 1
id: tasknotes_ops_triage
name: TaskNotes ops triage
description: Sync dirty GitHub issues into .ops and run a coding agent when triage work exists.
enabled: true

vars:
  repo: callumalpass/tasknotes
  root: /home/calluma/projects/tasknotes
  opsRoot: /home/calluma/projects/tasknotes/.ops
  memory: /home/calluma/.config/tickle/scripts/tasknotes-ops/memory.md
  issueLimit: 500

requires:
  capabilities:
    - github.issue.read
    - ops.registry.read
    - ops.registry.write
    - command.execute
    - agent.execute

triggers:
  - id: every_30m
    type: schedule.interval
    event: schedule.interval.fired
    every: 30m

steps:
  - id: dirty
    type: command.run
    input:
      command:
        - /home/calluma/.config/tickle/scripts/tasknotes-ops/has-unseen-or-updated-issues.sh
      cwd:
        $expr: vars.root
      env:
        GITHUB_REPOSITORY:
          $expr: vars.repo
        TASKNOTES_OPS_ROOT:
          $expr: vars.opsRoot
        GITHUB_ISSUE_LIMIT:
          $expr: string(vars.issueLimit)
      stdout: json
      timeout: 2m
      result:
        successExitCodes: [0]
        skipExitCodes: [1]
        outputPath: payload
        dedupeKeyPath: event_id
        reasonPath: reason

  - id: triage
    type: agent.run
    if:
      $expr: >
        steps.dirty.output.selected.missing_issues.length > 0 ||
        steps.dirty.output.selected.updated_issues.length > 0 ||
        steps.dirty.output.selected.duplicate_issues.length > 0
    input:
      prompt: "[[tasknotes.ops.triage]]"
      cwd:
        $expr: vars.root
      memory:
        $expr: vars.memory
      model: gpt-5.5
      maxDuration: 4h
      payload:
        dirtyIssues:
          $expr: steps.dirty.output.selected

run:
  mode: sequential
  concurrency:
    group: workflow
    policy: skip
  limits:
    timeout: 4h
  onError: stop
---

# TaskNotes Ops Triage

Equivalent to the current `tasknotes-ops` Tickle job.

The dirty issue check is an explicit `command.run` step. The prompt is passed as input to the generic `agent.run` action.
