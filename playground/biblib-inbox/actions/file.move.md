---
type: action
id: file.move
name: Move file
provider: mdbase
materialization: mirror
description: Move or rename a source file into its final attachment location.
requires:
  capabilities:
    - file.move.execute
inputSchema:
  type: object
  required: [from, to]
  fields:
    from:
      type: string
    to:
      type: string
    overwrite:
      type: boolean
      default: false
outputSchema:
  type: object
  fields:
    path:
      type: string
    moved:
      type: boolean
effects:
  - file.move.execute
emits:
  - filesystem.file.moved
---

# Move File

Generic file action for source attachment filing.
