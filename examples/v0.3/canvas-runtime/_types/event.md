---
kind: mdbase.type
name: event
version: 1
description: Runtime event contract.

match:
  where:
    type: event

schema:
  dialect: json-schema-2020-12
  ref: "../../../../schemas/v0.3/runtime/event.schema.json"
---

# Event

An event contract describes the payload shape of an event a runtime can emit.

