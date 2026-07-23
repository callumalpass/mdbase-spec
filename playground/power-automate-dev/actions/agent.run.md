---
type: action
id: agent.run
name: Run agent
provider: agent
materialization: mirror
description: Invoke a coding agent with a prompt resource, payload, working directory, and runtime options.
requires:
  capabilities:
    - agent.execute
inputSchema:
  type: object
  required: [prompt, cwd]
  fields:
    prompt:
      type: link
      target: prompt
      validate_exists: true
    payload:
      type: any
    cwd:
      type: string
    model:
      type: string
    maxDuration:
      type: string
    writeTargets:
      type: list
      items:
        type: string
outputSchema:
  type: object
  fields:
    summary:
      type: string
    records:
      type: any
    artifacts:
      type: list
      items:
        type: string
    filesChanged:
      type: list
      items:
        type: string
effects:
  - file.write
  - record.write
emits: []
---

# Run Agent

Runs a coding agent. The prompt is an input resource, not a separate action.

This package treats `agent.run` as a runtime-owned action. Materializing this contract exposes the interface; it does not define how Codex, Claude, or another agent is launched.
