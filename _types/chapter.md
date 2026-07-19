---
kind: mdbase.type
name: chapter
version: 1
description: A numbered chapter of the current mdbase specification.
schema:
  dialect: json-schema-2020-12
  value:
    $schema: "https://json-schema.org/draft/2020-12/schema"
    type: object
    additionalProperties: true
    properties:
      title:
        type: string
      section:
        type: integer
        minimum: 0
        maximum: 16
      status:
        enum: [draft, review, stable]
      normative:
        type: boolean
match:
  path_glob: "[0-9][0-9]-*.md"
collection:
  display:
    name_field: title
  read_defaults:
    status: stable
    normative: true
---

# Specification chapter

Editorial frontmatter is optional. The numbered filename is authoritative for
chapter order; the JSON Schema describes metadata when a chapter chooses to
persist it.
