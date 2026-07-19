# Canvas Runtime v0.3 Proof Collection

This collection demonstrates the v0.3 split:

- `schema.value` validates persisted task frontmatter.
- `collection.*` declares mdbase-aware behavior such as display fields,
  read defaults, and path policy.
- `lifecycle.*` declares managed IDs and timestamps.
- runtime contracts define providers, events, actions, capabilities, and policy
  as typed records.
- the workflow maps a runtime event to an action call, while runtime policy
  selects the local executor.

The runtime still implements the actual event emission and action handler. The
collection only declares the behavior contract.

The prototype executor in `packages/runtime-executor` runs this flow in memory:
sample `canvas.drop` event, CEL trigger/input evaluation, action input
validation, `mdbase.record.patch`, and action output validation.

## Flow

1. A canvas-capable runtime emits `canvas.drop`.
2. The runtime validates the delivered event envelope against
   `events/canvas.drop.md`.
3. `workflows/canvas-zone-set-status.md` matches the event.
4. The workflow evaluates its step input.
5. The runtime validates the input against `actions/mdbase.record.patch.md`.
6. `policies/local-runtime.md` selects the local executor for this workflow.
7. The runtime dispatches its built-in `mdbase.record.patch` handler.
