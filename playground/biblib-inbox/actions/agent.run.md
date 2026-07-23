---
type: action
id: agent.run
name: Run agent
provider: agent
materialization: mirror
description: Invoke an agent with a prompt resource, payload, and bounded write targets.
requires:
  capabilities:
    - agent.execute
inputSchema:
  type: object
  required: [prompt]
  fields:
    prompt:
      type: link
      target: prompt
      validate_exists: true
    payload:
      type: any
    cwd:
      type: string
    writeTargets:
      type: list
      items:
        type: string
    maxDuration:
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
effects:
  - record.write
emits: []
---

# Run Agent

The runtime decides how to launch the agent. This contract only describes the interface.
