---
type: event
id: powerautomate.flowDocumentation.requested
name: Existing flow documentation requested
provider: powerautomate-dev
materialization: custom
description: Emitted when a user asks an agent to document an existing Power Automate flow.
payloadSchema:
  type: object
  required: [environmentAlias, flowId]
  fields:
    environmentAlias:
      type: string
    flowId:
      type: string
    outputPath:
      type: string
---

# Existing Flow Documentation Requested

Shows that the package can drive maintenance work, not just new flow creation.
