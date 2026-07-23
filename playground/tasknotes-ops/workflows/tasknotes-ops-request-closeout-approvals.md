---
type: workflow
schemaVersion: 1
id: tasknotes_ops_request_closeout_approvals
name: TaskNotes ops request closeout approvals
description: Request Pickle approvals for close-ready TaskNotes issue sidecars.
enabled: true

vars:
  opsRoot: /home/calluma/projects/tasknotes/.ops
  limit: 20

requires:
  capabilities:
    - ops.registry.read
    - ops.registry.write
    - pickle.request.write
    - command.execute

triggers:
  - id: every_6h
    type: schedule.interval
    event: schedule.interval.fired
    every: 6h

steps:
  - id: request_closeouts
    type: command.run
    input:
      command:
        - python
        - /home/calluma/.config/tickle/scripts/tasknotes-ops/pickle-approvals.py
        - request-closeouts
        - --ops-root
        - "{{vars.opsRoot}}"
        - --limit
        - "{{vars.limit}}"
      cwd: /home/calluma/projects/tasknotes
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

# TaskNotes Ops Request Closeout Approvals

Equivalent to the current `tasknotes-ops-closeout-requests` Tickle job.
