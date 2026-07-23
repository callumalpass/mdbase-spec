---
type: note
title: TaskNotes Ops Runtime Playground
---

# TaskNotes Ops Runtime Playground

This nested collection is a non-executable playground for the draft runtime profile in `16-runtime-profile.md`.

It models the current Tickle TaskNotes ops automations as mdbase records:

- action contracts in `actions/`
- runtime event contracts in `events/`
- capability records in `capabilities/`
- prompt resources in `prompts/`
- workflow definitions in `workflows/`
- local policy in `policies/`

The important modeling choices are:

- prompts are inputs to `agent.run`, not separate actions
- local scripts are explicit `command.run` steps in workflows
- runtime instances implement built-in actions themselves
