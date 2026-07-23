---
type: action
id: pp.dv.query
name: Query Dataverse
provider: pp
materialization: custom
description: Run a read-only Dataverse request through pp.
requires:
  capabilities:
    - pp.dataverse.read
inputSchema:
  type: object
  required: [env, path]
  fields:
    env:
      type: string
    path:
      type: string
    method:
      type: enum
      values: [GET, POST]
      default: GET
    query:
      type: any
    body:
      type: any
    jq:
      type: string
outputSchema:
  type: object
  fields:
    data:
      type: any
    selected:
      type: any
    request:
      type: any
effects:
  - network.http
emits: []
---

# Query Dataverse

A runtime could implement this with `pp dv <path> --env <env> --read`.
