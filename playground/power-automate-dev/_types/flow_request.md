---
name: flow_request
description: Human-authored request for a Power Automate flow
display_name_key: title
match:
  path_glob: "requests/**/*.md"
strict: "warn"
fields:
  id:
    type: string
    required: true
    unique: true
  title:
    type: string
    required: true
  environmentAlias:
    type: string
    required: true
  solutionName:
    type: string
  owner:
    type: string
  status:
    type: enum
    values: [draft, ready, designing, validating, awaiting_approval, approved, deployed, blocked, cancelled]
    default: draft
  tables:
    type: list
    items:
      type: string
  connectors:
    type: list
    items:
      type: string
  acceptanceCriteria:
    type: list
    items:
      type: string
  constraints:
    type: any
---

# Flow Request

A durable brief for agent-assisted Power Automate development.
