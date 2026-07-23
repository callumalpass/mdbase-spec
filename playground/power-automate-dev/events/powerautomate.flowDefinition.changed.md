---
type: event
id: powerautomate.flowDefinition.changed
name: Flow definition changed
provider: powerautomate-dev
materialization: custom
description: Emitted when a flow design changes and should be revalidated.
payloadSchema:
  type: object
  required: [designId, path, environmentAlias]
  fields:
    designId:
      type: string
    path:
      type: string
    environmentAlias:
      type: string
    flowDisplayName:
      type: string
---

# Flow Definition Changed

Used to trigger validation after manual edits or agent repair.
