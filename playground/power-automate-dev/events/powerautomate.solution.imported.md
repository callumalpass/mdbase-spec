---
type: event
id: powerautomate.solution.imported
name: Solution imported
provider: pp
materialization: custom
description: Emitted after a solution import completes.
payloadSchema:
  type: object
  required: [environmentAlias, solutionName]
  fields:
    environmentAlias:
      type: string
    solutionName:
      type: string
    importJobId:
      type: string
    status:
      type: string
---

# Solution Imported

Included for deployment workflows that use solution import instead of direct flow updates.
