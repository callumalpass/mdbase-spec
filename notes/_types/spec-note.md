---
name: spec-note
description: A spec clarification note, ambiguity record, or editorial observation

match:
  path_glob: "SN-*.md"

fields:
  id:
    type: string
    required: true
    unique: true
    pattern: "^SN-[0-9]{3}$"
    description: "Unique note identifier, e.g. SN-001"

  title:
    type: string
    required: true
    description: "Short description of the issue"

  sections:
    type: list
    items:
      type: string
    default: []
    description: "Spec sections referenced, e.g. [§7.11, Appendix C.1]"

  status:
    type: enum
    values: [open, resolved]
    required: true
    default: open

  kind:
    type: enum
    values: [ambiguity, issue, gap, conformance_gap, language]
    required: true
    description: "ambiguity=spec wording unclear, issue=bug/contradiction, gap=untested behaviour, conformance_gap=test coverage, language=editorial"

  severity:
    type: enum
    values: [low, medium, high]
    description: "Optional. Populated for cross-reference review notes."
---
