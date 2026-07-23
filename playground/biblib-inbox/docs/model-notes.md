---
type: note
title: BibLib inbox model notes
---

# BibLib Inbox Model Notes

This package deliberately does not make BibLib itself into a workflow engine.

BibLib owns:

- metadata fetch and write behavior
- citekey and filename generation
- attachment import rules
- Translation Server integration

mdbase owns:

- durable import queue state
- candidate metadata records
- review questions
- validation and repair loops
- headless event/workflow coordination

The skill owns:

- local judgement about note shape
- when to trust BibLib metadata
- how to inspect parent/sibling chapter notes
- how to preserve vault-specific fields

## Why This Fits mdbase

The vault is the system of record. The target output is a typed markdown literature note that must validate against the local `literature` type.

The workflow is not trying to encode the agent's whole reasoning path. It provides checkpoints:

- inbox file noticed
- candidate metadata exists
- candidate is confident enough or needs review
- note was written
- validation failed and needs repair

## Real Runtime Notes

A real runtime would likely adapt system-level file watchers into `filesystem.file.created` events. The vault does not own the watcher; it owns the workflow definitions and durable queue state.

Automatic writing should probably start in dry-run or review-required mode. Once the package proves reliable for a vault, a user could allow high-confidence DOI/ISBN matches to write notes automatically.
