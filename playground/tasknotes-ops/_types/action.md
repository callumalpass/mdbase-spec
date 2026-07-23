---
name: action
description: Runtime action contract
extends: base_runtime_record
display_name_key: id
match:
  path_glob: "actions/**/*.md"
strict: "warn"
fields:
  requires:
    type: any
  inputSchema:
    type: any
  outputSchema:
    type: any
  effects:
    type: list
    items:
      type: string
    default: []
  emits:
    type: list
    items:
      type: string
    default: []
---

# Action

Defines a workflow-callable operation contract. Runtime instances decide which action IDs they support.
