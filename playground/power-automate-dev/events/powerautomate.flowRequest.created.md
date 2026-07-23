---
type: event
id: powerautomate.flowRequest.created
name: Flow request created
provider: powerautomate-dev
materialization: custom
description: Emitted when a flow request becomes ready for agent design.
payloadSchema:
  type: object
  required: [requestId, path, environmentAlias, status]
  fields:
    requestId:
      type: string
    path:
      type: string
    environmentAlias:
      type: string
    solutionName:
      type: string
    status:
      type: string
---

# Flow Request Created

In a file-watching runtime, this could be derived from a new or updated `flow_request` record whose status is `ready`.
