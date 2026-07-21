---
kind: mdbase.type
name: view
version: 1
description: A portable named collection of executable mdbase views.

match:
  where:
    type: view

schema:
  dialect: json-schema-2020-12
  ref: "../schemas/v0.3/view.schema.json"

collection:
  display:
    name_field: name
---

# View

A view record stores shared query scope and one or more stable named views.
Each named view resolves to the query model in Chapter 11. Optional
`presentation` metadata is advisory and does not alter headless query results.

View records are ordinary Markdown records, not runtime contracts. Collections
may copy or materialize this type definition when they want portable saved
views.
