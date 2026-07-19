---
type: event
id: canvas.drop
version: 1
provider: canvas-bases
name: Canvas card dropped
description: Emitted when a card is dropped on a canvas zone.

schemas:
  dialect: json-schema-2020-12
  payload:
    type: object
    required: [board, file, zone, position]
    additionalProperties: false
    properties:
      board:
        type: object
        required: [path, view]
        additionalProperties: false
        properties:
          path:
            type: string
          view:
            type: string
      file:
        type: object
        required: [path]
        additionalProperties: false
        properties:
          path:
            type: string
      zone:
        type: object
        required: [id, label]
        additionalProperties: false
        properties:
          id:
            enum: [todo, doing, done]
          label:
            type: string
      position:
        type: object
        required: [x, y]
        additionalProperties: false
        properties:
          x:
            type: number
          y:
            type: number
---

# Canvas card dropped

The canvas runtime emits this event after a task card is dropped on a zone.

