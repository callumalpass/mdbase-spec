---
type: event
id: powerautomate.flowValidation.passed
name: Flow validation passed
provider: pp
materialization: custom
description: Emitted when a candidate flow definition passes service validation.
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
    warningCount:
      type: integer
---

# Flow Validation Passed

Can trigger approval request creation.
