---
type: note
title: Power Automate package model notes
---

# Power Automate Package Model Notes

This prototype treats Power Automate development as a workflow over durable records:

1. A human writes a `flow_request`.
2. A runtime emits `powerautomate.flowRequest.created` when the request is ready.
3. The workflow gathers Dataverse and connector metadata through `pp` actions.
4. `agent.run` drafts a `flow_design`.
5. `pp.flow.validate` checks the candidate definition through the Flow service.
6. Failed validation emits repair work.
7. Passed validation creates a deployment plan and approval request.
8. Deployment happens only from an approval event.

## Why This Is More Than A Skill

A Codex skill is excellent for local instruction:

```text
When asked about Power Platform, use pp like this.
```

This package defines shared state and process:

```text
Here are the records that represent work.
Here are the events that start or continue work.
Here are the actions a runtime may execute.
Here are the prompts that shape agent work.
Here are the approval and deployment gates.
```

That means the package can be inspected by humans, validated by tooling, reused by different agents, and eventually rendered in a UI.

## Runtime Binding

The `pp.*` action contracts are not implementations. A runtime decides whether it can execute them.

Possible bindings:

- call `pp` CLI commands
- call `pp` MCP tools
- call a future `pp` library API
- ask an agent to use `pp` directly when deterministic bindings are unavailable

Materialized action contracts are interface descriptions. Editing them should not change what `pp` or the runtime actually does.

## Safety Boundary

The package lets low-risk design and validation happen before approval. High-risk capabilities such as `pp.flow.write` are only granted to the approval-triggered deployment workflow in the example policy.

This is not a complete governance model. Tenant DLP, environment strategy, connection ownership, and ALM rules still belong to the organization.
