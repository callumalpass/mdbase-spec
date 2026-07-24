---
kind: mdbase.type
name: runtime_timer
version: 1
description: Materialized generation-safe one-shot runtime timer.

match:
  where:
    type: runtime_timer

schema:
  dialect: json-schema-2020-12
  ref: "../../../../schemas/v0.3/runtime/timer.schema.json"
---

# Runtime Timer

Timer records are optional durable runtime state.
