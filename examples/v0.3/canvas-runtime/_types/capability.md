---
kind: mdbase.type
name: capability
version: 1
description: Runtime capability contract.

match:
  where:
    type: capability

schema:
  dialect: json-schema-2020-12
  ref: "../../../../schemas/v0.3/runtime/capability.schema.json"
---

# Capability

A capability describes a permission or risk atom used by runtime policy.
Capability records are optional catalog entries; effective providers and actions
can also declare capability IDs without materializing a record.
