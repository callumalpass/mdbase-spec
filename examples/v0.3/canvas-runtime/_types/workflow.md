---
kind: mdbase.type
name: workflow
version: 1
description: Runtime workflow record.

match:
  where:
    type: workflow

schema:
  dialect: json-schema-2020-12
  ref: "../../../../schemas/v0.3/runtime/workflow.schema.json"
---

# Workflow

A workflow maps events to action steps.

