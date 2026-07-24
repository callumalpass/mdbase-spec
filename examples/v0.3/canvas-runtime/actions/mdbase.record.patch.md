---
type: action
id: mdbase.record.patch
version: 1
provider: mdbase
name: Patch record frontmatter
description: Apply a shallow frontmatter patch to a Markdown record.

requires:
  capabilities:
    - mdbase.record.write

schemas:
  dialect: json-schema-2020-12
  input:
    type: object
    required: [path, patch]
    additionalProperties: false
    properties:
      path:
        type: string
        minLength: 1
      patch:
        type: object
        minProperties: 1
        additionalProperties: true
  output:
    type: object
    required: [path, frontmatter]
    additionalProperties: false
    properties:
      path:
        type: string
      frontmatter:
        type: object
        additionalProperties: true

effects:
  - mdbase.record.write

emits:
  - mdbase.record.modified

dispatch:
  idempotency: invocation_id
  cancellation: cooperative

risk: medium
---

# Patch record frontmatter

This contract describes the portable `mdbase.record.patch` action. The runtime
still supplies the handler.
