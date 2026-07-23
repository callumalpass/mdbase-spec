---
type: runtime_policy
id: local_biblib_inbox
name: Local BibLib inbox policy
runtime: local-mdbase-runtime
description: Example local policy for headless BibLib inbox processing.

grants:
  - capability: record.write
    to: workflow:biblib_watch_inbox_file

  - capability: file.inspect
    to: workflow:biblib_extract_metadata_candidate
  - capability: biblib.fetch.execute
    to: workflow:biblib_extract_metadata_candidate
  - capability: agent.execute
    to: workflow:biblib_extract_metadata_candidate
  - capability: record.write
    to: workflow:biblib_extract_metadata_candidate

  - capability: review.request.create
    to: workflow:biblib_route_low_confidence_candidate
  - capability: record.write
    to: workflow:biblib_route_low_confidence_candidate

  - capability: biblib.write.execute
    to: workflow:biblib_write_accepted_candidate
  - capability: file.move.execute
    to: workflow:biblib_write_accepted_candidate
  - capability: record.write
    to: workflow:biblib_write_accepted_candidate

  - capability: agent.execute
    to: workflow:biblib_repair_invalid_literature_note

denies: []
---

# Local BibLib Inbox Policy

This policy lets the runtime inspect new files, fetch metadata, ask an agent for research when needed, request human review, and write accepted literature notes.

It is illustrative. A real vault should decide whether automatic note writing and file moves are allowed without a review gate.
