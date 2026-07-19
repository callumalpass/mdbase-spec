---
kind: mdbase.type
name: action
version: 1
description: Runtime action contract.

match:
  where:
    type: action

schema:
  dialect: json-schema-2020-12
  ref: "../../../../schemas/v0.3/runtime/action.schema.json"
---

# Action

An action contract describes a workflow-callable operation. It does not
implement the operation.

