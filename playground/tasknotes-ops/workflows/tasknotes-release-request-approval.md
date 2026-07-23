---
type: workflow
schemaVersion: 1
id: tasknotes_release_request_approval
name: TaskNotes release request approval
description: Request release approval when unreleased issue-backed changes reach the configured threshold.
enabled: true

vars:
  root: /home/calluma/projects/tasknotes
  threshold: 8
  stateFile: /home/calluma/.config/tickle/scripts/tasknotes-release-monitor/state.json

requires:
  capabilities:
    - file.read
    - file.write
    - pickle.request.write
    - command.execute

triggers:
  - id: every_6h
    type: schedule.interval
    event: schedule.interval.fired
    every: 6h

steps:
  - id: inspect
    type: command.run
    input:
      command:
        - python
        - /home/calluma/.config/tickle/scripts/tasknotes-release-monitor/release-monitor.py
        - --root
        - "{{vars.root}}"
        - --state-file
        - "{{vars.stateFile}}"
        - check-threshold
        - --threshold
        - "{{vars.threshold}}"
      cwd:
        $expr: vars.root
      stdout: json
      timeout: 45s
      result:
        successExitCodes: [0]
        skipExitCodes: [1]
        outputPath: payload
        dedupeKeyPath: event_id
        reasonPath: reason

  - id: request
    type: command.run
    if:
      $expr: steps.inspect.status == "succeeded"
    input:
      command:
        - python
        - /home/calluma/.config/tickle/scripts/tasknotes-release-monitor/release-monitor.py
        - --root
        - "{{vars.root}}"
        - --state-file
        - "{{vars.stateFile}}"
        - ask
      cwd:
        $expr: vars.root
      stdout: json
      timeout: 2m
      result:
        successExitCodes: [0]
        outputPath: "."

run:
  mode: sequential
  concurrency:
    group: workflow
    policy: skip
  limits:
    timeout: 2m
  onError: stop
---

# TaskNotes Release Request Approval

Equivalent to the current `tasknotes-release-approval` Tickle job.
