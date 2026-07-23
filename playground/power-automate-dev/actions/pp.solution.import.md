---
type: action
id: pp.solution.import
name: Import solution
provider: pp
materialization: custom
description: Import a Power Platform solution package into a target environment.
requires:
  capabilities:
    - pp.solution.import.execute
inputSchema:
  type: object
  required: [env, packagePath]
  fields:
    env:
      type: string
    packagePath:
      type: string
    publishChanges:
      type: boolean
      default: false
outputSchema:
  type: object
  fields:
    importJobId:
      type: string
    status:
      type: string
    raw:
      type: any
effects:
  - pp.solution.import.execute
  - network.http
emits:
  - powerautomate.solution.imported
---

# Import Solution

Included to show how deployment could extend beyond direct flow upsert.
