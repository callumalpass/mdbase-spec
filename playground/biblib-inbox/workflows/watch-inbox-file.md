---
type: workflow
schemaVersion: 1
id: biblib_watch_inbox_file
name: Watch BibLib inbox file
description: Convert a new PDF or EPUB in the inbox folder into a durable import queue item.
enabled: true
materialization: materialized

vars:
  inboxGlob: "biblib/inbox/**/*"
  targetVault: /home/calluma/notes

requires:
  capabilities:
    - record.write

triggers:
  - id: file_created
    type: filesystem.file.created
    event: filesystem.file.created
    path:
      glob: "biblib/inbox/**/*"

conditions:
  - $expr: 'event.payload.extension == "pdf" || event.payload.extension == "epub"'

steps:
  - id: create_import_item
    type: mdbase.record.upsert
    input:
      path: "inbox/{{event.id}}.md"
      mode: create
      frontmatter:
        type: import_item
        id: "{{event.id}}"
        title: "Import {{event.payload.path}}"
        sourcePath: "{{event.payload.path}}"
        sourceKind:
          $expr: event.payload.extension
        status: new
        targetVault:
          $expr: vars.targetVault
        createdAt:
          $expr: event.occurredAt
        updatedAt:
          $expr: event.occurredAt
      body: |
        Created from a watched inbox file.

run:
  mode: sequential
  concurrency:
    group: "{{event.payload.path}}"
    policy: skip
  limits:
    timeout: 1m
  onError: stop
---

# Watch Inbox File

The watcher is system-level. The workflow only turns a file event into durable mdbase state.
