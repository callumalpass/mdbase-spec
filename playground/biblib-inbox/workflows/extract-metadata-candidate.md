---
type: workflow
schemaVersion: 1
id: biblib_extract_metadata_candidate
name: Extract metadata candidate
description: Inspect an import item, use deterministic BibLib lookup when possible, and ask an agent to research if needed.
enabled: true
materialization: materialized

vars:
  confidenceThreshold: 0.85
  workingRoot: /home/calluma/notes
  vaultConventions: /home/calluma/.codex/skills/literature-note-creation/references/vault-conventions.md

requires:
  capabilities:
    - file.inspect
    - biblib.fetch.execute
    - agent.execute
    - record.write

triggers:
  - id: import_item_created
    type: biblib.importItem.created
    event: biblib.importItem.created

steps:
  - id: inspect
    type: file.inspectDocument
    input:
      path: "{{event.payload.sourcePath}}"
      kind:
        $expr: event.payload.sourceKind

  - id: fetch
    type: biblib.fetch
    if:
      $expr: steps.inspect.output.identifiers.length > 0
    input:
      query:
        $expr: steps.inspect.output.identifiers[0]
      format: json
      ensureServer: true

  - id: research
    type: agent.run
    if:
      $expr: steps.fetch.status != "succeeded" || steps.fetch.output.confidence < vars.confidenceThreshold
    input:
      prompt: "[[biblib.identifySource]]"
      cwd:
        $expr: vars.workingRoot
      maxDuration: 30m
      writeTargets:
        - "candidates/{{event.payload.itemId}}.md"
      payload:
        importItem: "{{event.payload.path}}"
        inspection:
          $expr: steps.inspect.output
        biblibFetch:
          $expr: steps.fetch.output
        vaultConventions:
          $expr: vars.vaultConventions

  - id: save_candidate
    type: mdbase.record.upsert
    input:
      path: "candidates/{{event.payload.itemId}}.md"
      mode: upsert
      frontmatter:
        type: metadata_candidate
        id: "candidate_{{event.payload.itemId}}"
        importItem: "{{event.payload.path}}"
        title:
          $expr: default(steps.research.output.records.metadata_candidate.title, default(steps.fetch.output.csl.title, event.payload.sourcePath))
        confidence:
          $expr: default(steps.research.output.records.metadata_candidate.confidence, default(steps.fetch.output.confidence, 0))
        status: draft
        identifiers:
          $expr: default(steps.fetch.output.identifiers, steps.inspect.output.identifiers)
        csl:
          $expr: default(steps.research.output.records.metadata_candidate.csl, steps.fetch.output.csl)
        evidence:
          $expr: steps.research.output.records.metadata_candidate.evidence
        proposedNotePath:
          $expr: steps.research.output.records.metadata_candidate.proposedNotePath
        proposedAttachmentPath:
          $expr: steps.research.output.records.metadata_candidate.proposedAttachmentPath
      body:
        $expr: default(steps.research.output.records.metadata_candidate.body, "Candidate created from deterministic BibLib lookup.")

  - id: update_item
    type: mdbase.record.upsert
    input:
      path: "{{event.payload.path}}"
      mode: update
      frontmatter:
        status: candidate_found
        candidate: "candidates/{{event.payload.itemId}}.md"
        detectedIdentifiers:
          $expr: steps.inspect.output.identifiers

run:
  mode: sequential
  concurrency:
    group: "{{event.payload.itemId}}"
    policy: skip
  limits:
    timeout: 45m
  onError: stop
---

# Extract Metadata Candidate

This workflow shows the intended division: deterministic inspection and `biblib fetch` first; agent research only when metadata is missing or weak.
