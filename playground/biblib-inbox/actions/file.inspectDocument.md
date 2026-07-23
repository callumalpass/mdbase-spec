---
type: action
id: file.inspectDocument
name: Inspect document file
provider: mdbase
materialization: custom
description: Extract lightweight metadata and identifier hints from a PDF, EPUB, or local document.
requires:
  capabilities:
    - file.inspect
inputSchema:
  type: object
  required: [path]
  fields:
    path:
      type: string
    kind:
      type: enum
      values: [pdf, epub, unknown]
outputSchema:
  type: object
  fields:
    title:
      type: string
    identifiers:
      type: list
      items:
        type: string
    embeddedMetadata:
      type: any
    textSnippets:
      type: list
      items:
        type: string
effects:
  - file.inspect
emits: []
---

# Inspect Document

This is the deterministic first pass before asking an agent to research.
