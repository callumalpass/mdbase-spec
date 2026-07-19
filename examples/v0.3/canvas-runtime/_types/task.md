---
kind: mdbase.type
name: task
version: 1
description: A task card that can be moved through canvas zones.

match:
  path_glob: "tasks/**/*.md"

schema:
  dialect: json-schema-2020-12
  value:
    $schema: "https://json-schema.org/draft/2020-12/schema"
    type: object
    required: [type, id, title, status]
    additionalProperties: false
    properties:
      type:
        const: task
      id:
        type: string
        minLength: 1
      title:
        type: string
        minLength: 1
      status:
        enum: [todo, doing, done]
        default: todo
      tags:
        type: array
        items:
          type: string
      dateCreated:
        type: string
        format: date-time
      dateModified:
        type: string
        format: date-time

collection:
  display:
    name_field: title
  read_defaults:
    status: todo
  unique:
    - field: id
      scope: type
  path:
    pattern: "tasks/{id}.md"

lifecycle:
  on_create:
    set:
      id: { ulid: true }
      dateCreated: { now: true }
      dateModified: { now: true }
  on_update:
    set:
      dateModified: { now: true }
---

# Task

A task is a record that can be moved across canvas zones. The canvas runtime can
turn a drop event into a patch that updates `status`.

