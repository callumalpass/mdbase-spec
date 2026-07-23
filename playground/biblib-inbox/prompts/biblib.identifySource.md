---
type: prompt
id: biblib.identifySource
name: Identify bibliographic source
provider: biblib-inbox
description: Research a PDF/EPUB when deterministic identifier extraction is insufficient.
inputSchema:
  type: object
  required: [importItem, inspection]
  fields:
    importItem:
      type: any
    inspection:
      type: any
    vaultConventions:
      type: string
output:
  expectedRecords:
    - metadata_candidate
constraints:
  - Prefer DOI, ISBN, arXiv, publisher page, library catalogue, or other stable identifiers.
  - Do not invent missing publication data.
  - Include evidence and confidence for every candidate.
  - If metadata is ambiguous, create a review question instead of writing a final note.
---

# Identify Bibliographic Source

You are helping create a BibLib literature note from a source file that appeared in an inbox folder.

Use the source filename, extracted text snippets, embedded metadata, and any detected identifiers to find the best bibliographic record.

Return a `metadata_candidate` with CSL-style metadata, evidence, confidence, and proposed note/attachment paths.
