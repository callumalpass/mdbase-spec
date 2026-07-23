---
type: note
title: Power Automate Agent Package Playground
---

# Power Automate Agent Package Playground

This nested collection is a non-executable prototype for a domain package that helps an agent develop Power Automate flows through `pp`.

It models a more concrete alternative to saying "build a Power Platform agent":

- typed work records in `requests/`, `designs/`, `validations/`, and `deployment-plans/`
- action contracts in `actions/`
- runtime event contracts in `events/`
- prompt resources in `prompts/`
- workflow definitions in `workflows/`
- local capability policy in `policies/`

The package assumes the runtime can provide executable bindings for actions such as `pp.dv.query`, `pp.flow.validate`, and `pp.flow.upsert`. Those bindings might call the `pp` CLI, `pp` MCP tools, or a future `pp` library API.

The important boundary is:

```text
pp skill = teaches one agent how to use pp
mdbase package = defines durable work state, actions, events, prompts, workflows, and policy
```

An agent can use this package as an operating model. A deterministic runtime can use the same records to validate inputs, enforce approvals, and coordinate execution.
