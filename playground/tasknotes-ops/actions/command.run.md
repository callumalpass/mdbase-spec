---
type: action
id: command.run
name: Run command
provider: mdbase
description: Execute a local command or script with explicit argv, working directory, environment, timeout, and stdout parsing.
requires:
  capabilities:
    - command.execute
inputSchema:
  type: object
  required: [command]
  fields:
    command:
      type: list
      items:
        type: string
    cwd:
      type: string
    env:
      type: object
      fields: {}
    stdout:
      type: enum
      values: [text, json, none]
      default: text
    timeout:
      type: string
    result:
      type: object
      fields:
        successExitCodes:
          type: list
          items:
            type: integer
        skipExitCodes:
          type: list
          items:
            type: integer
        outputPath:
          type: string
        dedupeKeyPath:
          type: string
        reasonPath:
          type: string
    outputSchema:
      type: any
outputSchema:
  type: object
  fields:
    exitCode:
      type: integer
    stdout:
      type: any
    stderr:
      type: string
    parsed:
      type: any
    selected:
      type: any
    reason:
      type: string
    dedupeKey:
      type: string
effects:
  - command.execute
emits: []
---

# Run Command

Runs a local command or script as an explicit workflow step. This is the generic escape hatch for local automation.
