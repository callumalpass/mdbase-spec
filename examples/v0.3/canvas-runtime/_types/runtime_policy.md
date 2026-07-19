---
kind: mdbase.type
name: runtime_policy
version: 1
description: Runtime policy record.

match:
  where:
    type: runtime_policy

schema:
  dialect: json-schema-2020-12
  ref: "../../../../schemas/v0.3/runtime/runtime-policy.schema.json"
---

# Runtime Policy

Runtime policies configure local executor selection, limits, and capability
gates.
