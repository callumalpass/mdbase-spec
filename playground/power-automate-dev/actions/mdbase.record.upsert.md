---
type: action
id: mdbase.record.upsert
name: Upsert mdbase record
provider: mdbase
materialization: mirror
description: Create or update a typed record in the current collection.
requires:
  capabilities:
    - record.write
inputSchema:
  type: object
  required: [path, frontmatter]
  fields:
    path:
      type: string
    frontmatter:
      type: any
    body:
      type: string
    mode:
      type: enum
      values: [create, update, upsert]
      default: upsert
outputSchema:
  type: object
  required: [path]
  fields:
    path:
      type: string
    created:
      type: boolean
    updated:
      type: boolean
effects:
  - record.write
emits:
  - mdbase.record.updated
---

# Upsert Record

Materialized here so the prototype workflow can show where agent output becomes durable package state.
