---
type: workflow
schemaVersion: 1
id: tasknotes_release_handle_approval
name: TaskNotes release handle approval
description: Handle an answered release approval by running the release agent or marking a rejection processed.
enabled: true

vars:
  root: /home/calluma/projects/tasknotes
  stateFile: /home/calluma/.config/tickle/scripts/tasknotes-release-monitor/state.json

requires:
  capabilities:
    - file.read
    - file.write
    - pickle.request.read
    - command.execute
    - agent.execute

triggers:
  - id: every_15m
    type: schedule.interval
    event: schedule.interval.fired
    every: 15m

steps:
  - id: response
    type: command.run
    input:
      command:
        - python
        - /home/calluma/.config/tickle/scripts/tasknotes-release-monitor/release-monitor.py
        - --root
        - "{{vars.root}}"
        - --state-file
        - "{{vars.stateFile}}"
        - check-answered
      cwd:
        $expr: vars.root
      stdout: json
      timeout: 45s
      result:
        successExitCodes: [0]
        skipExitCodes: [1]
        outputPath: payload
        dedupeKeyPath: event_id

  - id: release_agent
    type: agent.run
    if:
      $expr: >
        steps.response.status == "succeeded" &&
        steps.response.output.selected.response.payload.decision != "reject"
    input:
      prompt: "[[tasknotes.release.approved]]"
      cwd:
        $expr: vars.root
      model: gpt-5.5
      maxDuration: 6h
      payload:
        approval:
          $expr: steps.response.output.selected

  - id: mark_rejected
    type: command.run
    if:
      $expr: >
        steps.response.status == "succeeded" &&
        steps.response.output.selected.response.payload.decision == "reject"
    input:
      command:
        - python
        - /home/calluma/.config/tickle/scripts/tasknotes-release-monitor/release-monitor.py
        - --state-file
        - "{{vars.stateFile}}"
        - mark-processed
        - --status
        - rejected
      cwd:
        $expr: vars.root
      stdout: json
      timeout: 45s
      result:
        successExitCodes: [0]
        outputPath: "."

  - id: mark_success
    type: command.run
    if:
      $expr: steps.release_agent.status == "succeeded"
    input:
      command:
        - python
        - /home/calluma/.config/tickle/scripts/tasknotes-release-monitor/release-monitor.py
        - --state-file
        - "{{vars.stateFile}}"
        - mark-processed
        - --status
        - success
      cwd:
        $expr: vars.root
      stdout: json
      timeout: 45s
      result:
        successExitCodes: [0]
        outputPath: "."

run:
  mode: sequential
  concurrency:
    group: workflow
    policy: skip
  limits:
    timeout: 6h
  onError: stop
---

# TaskNotes Release Handle Approval

Equivalent to the current `tasknotes-release-approved` Tickle job.

The release instructions live in a prompt resource passed to `agent.run`; the workflow owns when that agent is invoked.
