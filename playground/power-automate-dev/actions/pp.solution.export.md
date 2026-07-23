---
type: action
id: pp.solution.export
name: Export solution
provider: pp
materialization: custom
description: Export a Power Platform solution for backup or deployment artifacts.
requires:
  capabilities:
    - pp.solution.export.execute
inputSchema:
  type: object
  required: [env, solutionName]
  fields:
    env:
      type: string
    solutionName:
      type: string
    outputPath:
      type: string
    managed:
      type: boolean
      default: false
outputSchema:
  type: object
  fields:
    path:
      type: string
    raw:
      type: any
effects:
  - file.write
  - network.http
emits: []
---

# Export Solution

Captures a solution artifact before or after deployment.
