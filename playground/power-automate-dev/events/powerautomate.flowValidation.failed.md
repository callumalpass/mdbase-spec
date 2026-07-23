---
type: event
id: powerautomate.flowValidation.failed
name: Flow validation failed
provider: pp
materialization: custom
description: Emitted when `pp.flow.validate` finds blocking errors.
payloadSchema:
  type: object
  required: [designId, validationId, designPath, validationPath, environmentAlias]
  fields:
    designId:
      type: string
    validationId:
      type: string
    designPath:
      type: string
    validationPath:
      type: string
    environmentAlias:
      type: string
    errorCount:
      type: integer
    errors:
      type: any
---

# Flow Validation Failed

Triggers the repair workflow.
