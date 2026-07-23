---
type: action
id: biblib.fetch
name: Fetch BibLib metadata
provider: biblib
materialization: custom
description: Fetch bibliographic metadata for an identifier or URL.
requires:
  capabilities:
    - biblib.fetch.execute
inputSchema:
  type: object
  required: [query]
  fields:
    query:
      type: string
    format:
      type: enum
      values: [json, yaml, frontmatter]
      default: json
    ensureServer:
      type: boolean
      default: true
outputSchema:
  type: object
  fields:
    csl:
      type: any
    identifiers:
      type: list
      items:
        type: string
    confidence:
      type: number
    raw:
      type: any
effects:
  - network.http
emits: []
---

# Fetch BibLib Metadata

Could be implemented by `biblib fetch <query> --format json --ensure-server`.
