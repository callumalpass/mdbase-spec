---
type: workflow
id: canvas.zone.set-status
version: 1
name: Set task status from canvas zone
description: When a task card is dropped on a zone, patch the task status to the zone ID.
enabled: true

requires:
  capabilities:
    - mdbase.record.write

triggers:
  - id: drop-on-status-zone
    event: canvas.drop
    if:
      $expr: 'has(event.payload.file.path) && has(event.payload.zone.id)'

steps:
  - id: patch-task-status
    action: mdbase.record.patch
    input:
      path:
        $expr: 'event.payload.file.path'
      patch:
        status:
          $expr: 'event.payload.zone.id'

run:
  execution:
    mode: single_executor
  idempotency:
    key:
      $expr: 'workflow.id + ":" + event.id + ":" + trigger.id'
  concurrency:
    group:
      $expr: 'event.payload.file.path'
    policy: replace
  limits:
    timeout: 30s
    max_items: 1
  on_error: stop
---

# Set task status from canvas zone

This workflow is collection behavior. A canvas-aware runtime emits the event and
implements the patch action; the workflow declares the mapping between them.
