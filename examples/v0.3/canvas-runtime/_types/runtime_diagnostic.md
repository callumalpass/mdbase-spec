---
kind: mdbase.type
name: runtime_diagnostic
version: 1
description: Materialized runtime diagnostic record.

match:
  where:
    type: runtime_diagnostic

schema:
  dialect: json-schema-2020-12
  ref: "../../../../schemas/v0.3/runtime/diagnostic.schema.json"
---

# Runtime Diagnostic

Diagnostic records are optional materialized runtime diagnostics.

