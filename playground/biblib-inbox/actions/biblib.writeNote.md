---
type: action
id: biblib.writeNote
name: Write BibLib literature note
provider: biblib
materialization: custom
description: Write a CSL metadata candidate into a literature note and attach the source file.
requires:
  capabilities:
    - biblib.write.execute
inputSchema:
  type: object
  required: [csl, notePath]
  fields:
    csl:
      type: any
    notePath:
      type: string
    attachmentPath:
      type: string
    sourcePath:
      type: string
    dryRun:
      type: boolean
      default: true
    preserveFields:
      type: list
      items:
        type: string
outputSchema:
  type: object
  fields:
    notePath:
      type: string
    attachmentPath:
      type: string
    citekey:
      type: string
    dryRun:
      type: boolean
    validation:
      type: any
effects:
  - file.write
  - biblib.write.execute
emits:
  - biblib.literatureNote.created
---

# Write Literature Note

Could be implemented by `biblib write`, `biblib from-json`, or the BibLib Obsidian plugin runtime API.
