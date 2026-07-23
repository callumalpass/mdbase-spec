---
type: action
id: pp.flow.validate
name: Validate Flow definition
provider: pp
materialization: custom
description: Call Power Automate validation endpoints for a candidate flow payload.
requires:
  capabilities:
    - pp.flow.validate.execute
inputSchema:
  type: object
  required: [env, displayName]
  fields:
    env:
      type: string
    flowId:
      type: string
    displayName:
      type: string
    definition:
      type: any
    definitionPath:
      type: string
    connectionReferences:
      type: any
outputSchema:
  type: object
  required: [status, errorCount, warningCount]
  fields:
    status:
      type: enum
      values: [passed, failed, warning, unknown]
    errorCount:
      type: integer
    warningCount:
      type: integer
    errors:
      type: list
      items:
        type: any
    warnings:
      type: list
      items:
        type: any
    raw:
      type: any
effects:
  - network.http
emits:
  - powerautomate.flowValidation.passed
  - powerautomate.flowValidation.failed
---

# Validate Flow Definition

A runtime could implement this with `pp flow /flows/<id>/checkFlowErrors` and `checkFlowWarnings`.
