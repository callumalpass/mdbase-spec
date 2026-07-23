---
type: event
id: powerautomate.flow.deployed
name: Flow deployed
provider: pp
materialization: custom
description: Emitted after a flow is created or updated.
payloadSchema:
  type: object
  required: [environmentAlias, flowId]
  fields:
    environmentAlias:
      type: string
    flowId:
      type: string
    designId:
      type: string
    url:
      type: string
---

# Flow Deployed

Deployment event emitted by `pp.flow.upsert`.
