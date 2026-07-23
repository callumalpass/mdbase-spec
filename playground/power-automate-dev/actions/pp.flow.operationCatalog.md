---
type: action
id: pp.flow.operationCatalog
name: Get Flow operation catalog
provider: pp
materialization: custom
description: Fetch connector and operation metadata used to design or repair a flow.
requires:
  capabilities:
    - pp.flow.read
inputSchema:
  type: object
  required: [env]
  fields:
    env:
      type: string
    usage:
      type: enum
      values: [Action, Trigger]
    searchText:
      type: string
    includeTags:
      type: list
      items:
        type: string
    excludeTags:
      type: list
      items:
        type: string
outputSchema:
  type: object
  fields:
    operationGroups:
      type: list
      items:
        type: any
    operations:
      type: list
      items:
        type: any
effects:
  - network.http
emits: []
---

# Get Flow Operation Catalog

This action represents the connector metadata endpoints that `pp` already exposes through Flow API requests.
