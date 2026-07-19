---
kind: mdbase.type
name: runtime_checkpoint
version: 1
description: Materialized workflow checkpoint record.

match:
  where:
    type: runtime_checkpoint

schema:
  dialect: json-schema-2020-12
  ref: "../../../../schemas/v0.3/runtime/checkpoint.schema.json"
---

# Runtime Checkpoint

Checkpoint records are optional durable runtime state.

