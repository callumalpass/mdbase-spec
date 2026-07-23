---
type: workflow
schemaVersion: 1
id: biblib_route_low_confidence_candidate
name: Route low-confidence candidate
description: Ask for human review when a metadata candidate is too uncertain to write automatically.
enabled: true
materialization: materialized

vars:
  confidenceThreshold: 0.85

requires:
  capabilities:
    - review.request.create
    - record.write

triggers:
  - id: candidate_found
    type: biblib.metadata.candidateFound
    event: biblib.metadata.candidateFound

conditions:
  - $expr: 'event.payload.confidence < vars.confidenceThreshold'

steps:
  - id: create_question
    type: mdbase.record.upsert
    input:
      path: "review-questions/{{event.payload.itemId}}.md"
      mode: upsert
      frontmatter:
        type: review_question
        id: "review_{{event.payload.itemId}}"
        importItem: "{{event.payload.itemPath}}"
        title: "Review metadata for {{event.payload.itemId}}"
        status: open
        question: "Which bibliographic record should be used for this imported file?"
        options:
          $expr: event.payload.identifiers
      body: |
        The candidate confidence is below the automatic-write threshold.

  - id: request_review
    type: review.request
    input:
      question: "Resolve BibLib metadata for {{event.payload.itemId}}"
      options:
        $expr: event.payload.identifiers
      relatedRecords:
        - "{{event.payload.itemPath}}"
        - "{{event.payload.candidatePath}}"
        - "review-questions/{{event.payload.itemId}}.md"

  - id: update_item
    type: mdbase.record.upsert
    input:
      path: "{{event.payload.itemPath}}"
      mode: update
      frontmatter:
        status: needs_review
        reviewQuestion: "review-questions/{{event.payload.itemId}}.md"

run:
  mode: sequential
  concurrency:
    group: "{{event.payload.itemId}}"
    policy: skip
  limits:
    timeout: 5m
  onError: stop
---

# Route Low-Confidence Candidate

The runtime does not guess when metadata is ambiguous. It writes a question record and asks a human.
