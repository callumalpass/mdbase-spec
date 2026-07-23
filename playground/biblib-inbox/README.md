---
type: note
title: BibLib Inbox Runtime Playground
---

# BibLib Inbox Runtime Playground

This nested collection is a non-executable prototype for a headless BibLib import queue.

The core use case is:

```text
PDF or EPUB appears in a watched inbox folder
-> runtime creates an import item
-> deterministic extraction and BibLib lookup run first
-> agent researches only if metadata is missing or weak
-> low-confidence candidates create a human review question
-> accepted candidates write a literature note and move the attachment
-> validation failures wake an agent repair workflow
```

This is a better mdbase fit than a chat-only skill because the trigger is not a human prompt. The runtime is coordinating stateful background work around durable files.

The package includes:

- queue records in `inbox/`
- candidate metadata records in `candidates/`
- review questions in `review-questions/`
- runtime action contracts in `actions/`
- event contracts in `events/`
- prompts in `prompts/`
- small checkpoint workflows in `workflows/`
- local capability policy in `policies/`

The existing literature-note skill remains useful. It supplies the agent's local know-how for repairing or creating notes. This package supplies the headless queue, events, checkpoints, and audit trail.
