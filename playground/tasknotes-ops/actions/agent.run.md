---
type: action
id: agent.run
name: Run agent
provider: agent
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
    memory:
      type: string
    model:
      type: string
    maxDuration:
      type: string
outputSchema: null
effects:
  - file.write
  - ops.registry.write
  - pickle.request.write
emits: []
---

# Run Agent

Runs a coding agent. The prompt is an input resource, not a separate action.

The runtime should record the prompt ID, prompt content hash, payload, agent command, final message, stdout/stderr, and changed files as run artifacts.
