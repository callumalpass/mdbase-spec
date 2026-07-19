---
kind: mdbase.type
name: runtime_run
version: 1
description: Materialized workflow run record.

match:
  where:
    type: runtime_run

schema:
  dialect: json-schema-2020-12
  ref: "../../../../schemas/v0.3/runtime/run.schema.json"
---

# Runtime Run

Run records are optional materialized runtime state.

