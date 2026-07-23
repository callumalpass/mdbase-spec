---
name: flow_design
description: Agent-authored Power Automate design record
display_name_key: title
match:
  path_glob: "designs/**/*.md"
strict: "warn"
fields:
  id:
    type: string
    required: true
    unique: true
  request:
    type: link
    target: flow_request
    validate_exists: true
    required: true
  title:
    type: string
    required: true
  environmentAlias:
    type: string
    required: true
  flowDisplayName:
    type: string
  status:
    type: enum
    values: [draft, validation_failed, validation_passed, awaiting_approval, approved, deployed, blocked]
    default: draft
  definitionPath:
    type: string
  definition:
    type: any
  connectionReferences:
    type: any
  assumptions:
    type: list
    items:
      type: string
  risks:
    type: list
    items:
      type: string
---

# Flow Design

The proposed flow definition, connection references, assumptions, and design notes.
