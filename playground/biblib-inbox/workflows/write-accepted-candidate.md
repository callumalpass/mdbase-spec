---
type: workflow
schemaVersion: 1
id: biblib_write_accepted_candidate
name: Write accepted BibLib candidate
description: Write a literature note from a high-confidence or human-approved metadata candidate.
enabled: true
materialization: materialized

vars:
  confidenceThreshold: 0.85
  preserveFields: [tags, authorLink, attachment, status]

requires:
  capabilities:
    - biblib.write.execute
    - file.move.execute
    - record.write

triggers:
  - id: candidate_found
    type: biblib.metadata.candidateFound
    event: biblib.metadata.candidateFound
  - id: review_answered
    type: biblib.metadata.reviewAnswered
    event: biblib.metadata.reviewAnswered

conditions:
  - $expr: 'event.type == "biblib.metadata.reviewAnswered" || event.payload.confidence >= vars.confidenceThreshold'

steps:
  - id: write_note
    type: biblib.writeNote
    input:
      csl:
        $expr: event.payload.csl
      notePath:
        $expr: event.payload.proposedNotePath
      attachmentPath:
        $expr: event.payload.proposedAttachmentPath
      sourcePath:
        $expr: event.payload.sourcePath
      dryRun: false
      preserveFields:
        $expr: vars.preserveFields

  - id: move_attachment
    type: file.move
    if:
      $expr: steps.write_note.output.attachmentPath != null
    input:
      from:
        $expr: event.payload.sourcePath
      to:
        $expr: steps.write_note.output.attachmentPath
      overwrite: false

  - id: update_item
    type: mdbase.record.upsert
    input:
      path:
        $expr: event.payload.itemPath
      mode: update
      frontmatter:
        status: done
        targetNotePath:
          $expr: steps.write_note.output.notePath
        attachmentTargetPath:
          $expr: steps.write_note.output.attachmentPath

run:
  mode: sequential
  concurrency:
    group:
      $expr: event.payload.itemId
    policy: skip
  limits:
    timeout: 10m
  onError: stop
---

# Write Accepted Candidate

The deterministic write happens only after the metadata candidate is good enough or a human has answered the review question.
