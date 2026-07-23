---
type: workflow
schemaVersion: 1
id: biblib_repair_invalid_literature_note
name: Repair invalid literature note
description: Ask an agent to repair a generated literature note that fails mdbase validation.
enabled: true
materialization: materialized

vars:
  workingRoot: /home/calluma/notes
  literatureSchema: /home/calluma/notes/_types/literature.md

requires:
  capabilities:
    - agent.execute

triggers:
  - id: validation_failed
    type: mdbase.validation.failed
    event: mdbase.validation.failed

conditions:
  - $expr: 'event.payload.type == "literature"'

steps:
  - id: repair
    type: agent.run
    input:
      prompt: "[[biblib.repairLiteratureNote]]"
      cwd:
        $expr: vars.workingRoot
      maxDuration: 20m
      writeTargets:
        - "{{event.payload.path}}"
      payload:
        notePath: "{{event.payload.path}}"
        errors:
          $expr: event.payload.errors
        literatureSchema:
          $expr: vars.literatureSchema

run:
  mode: sequential
  concurrency:
    group: "{{event.payload.path}}"
    policy: queue
  limits:
    timeout: 30m
  onError: stop
---

# Repair Invalid Literature Note

This is where the existing literature-note skill fits: the workflow wakes the agent, and the skill supplies local note-repair know-how.
