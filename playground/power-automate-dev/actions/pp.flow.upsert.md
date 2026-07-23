---
type: action
id: pp.flow.upsert
name: Create or update Flow
provider: pp
materialization: custom
description: Create or update a Power Automate flow after validation and approval.
requires:
  capabilities:
    - pp.flow.write
inputSchema:
  type: object
  required: [env, displayName, definition]
  fields:
    env:
      type: string
    flowId:
      type: string
    displayName:
      type: string
    definition:
      type: any
    connectionReferences:
      type: any
    solutionName:
      type: string
    dryRun:
      type: boolean
      default: true
outputSchema:
  type: object
  fields:
    flowId:
      type: string
    url:
      type: string
    dryRun:
      type: boolean
    raw:
      type: any
effects:
  - pp.flow.write
emits:
  - powerautomate.flow.deployed
---

# Create Or Update Flow

High-risk action. The sample policy grants it only to the approval-triggered deployment workflow.
