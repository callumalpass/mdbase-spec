---
type: event
id: biblib.literatureNote.created
name: Literature note created
provider: biblib
materialization: custom
description: Emitted after BibLib writes a literature note.
payloadSchema:
  type: object
  required: [notePath, citekey]
  fields:
    notePath:
      type: string
    attachmentPath:
      type: string
    citekey:
      type: string
    importItem:
      type: string
---

# Literature Note Created

Used to mark import queue records done.
