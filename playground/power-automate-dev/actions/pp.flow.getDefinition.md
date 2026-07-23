---
type: action
id: pp.flow.getDefinition
name: Get Flow definition
provider: pp
materialization: custom
description: Fetch an existing Power Automate flow definition and properties.
requires:
  capabilities:
    - pp.flow.read
inputSchema:
  type: object
  required: [env, flowId]
  fields:
    env:
      type: string
    flowId:
      type: string
outputSchema:
  type: object
  fields:
    flowId:
      type: string
    properties:
      type: any
    definition:
      type: any
    connectionReferences:
      type: any
effects:
  - network.http
emits: []
---

# Get Flow Definition

Used by documentation and repair workflows.
