---
kind: mdbase.type
name: provider
version: 1
description: Runtime provider contract.

match:
  where:
    type: provider

schema:
  dialect: json-schema-2020-12
  ref: "../../../../schemas/v0.3/runtime/provider.schema.json"
---

# Provider

A provider contract describes an event/action/capability source. Provider
records are optional materializations of runtime/provider registry entries.
