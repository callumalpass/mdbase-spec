---
type: event
id: biblib.importItem.created
name: BibLib import item created
provider: biblib-inbox
materialization: custom
description: Emitted when a watched file is converted into a durable import queue item.
payloadSchema:
  type: object
  required: [itemId, path, sourcePath, sourceKind]
  fields:
    itemId:
      type: string
    path:
      type: string
    sourcePath:
      type: string
    sourceKind:
      type: string
---

# Import Item Created

Starts metadata extraction and candidate creation.
