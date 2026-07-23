---
type: prompt
id: biblib.repairLiteratureNote
name: Repair literature note
provider: biblib-inbox
description: Repair a literature note that failed mdbase validation.
inputSchema:
  type: object
  required: [notePath, errors]
  fields:
    notePath:
      type: string
    errors:
      type: any
    literatureSchema:
      type: string
    sourceCandidate:
      type: any
output:
  expectedArtifacts:
    - literature_note_patch
constraints:
  - Preserve manual fields such as tags, authorLink, attachment, reading state, and chapter sidecar links.
  - Fix the note to match the local literature type rather than weakening the schema.
  - Validate after editing.
---

# Repair Literature Note

Use this when a generated literature note fails validation.
