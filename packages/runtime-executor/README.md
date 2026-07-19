# @mdbase/runtime-executor

Prototype mdbase v0.3 workflow executor.

This package is intentionally small. It proves the runtime path:

1. load contracts with `@mdbase/runtime-contracts`
2. validate a delivered event envelope
3. match enabled workflows and triggers
4. evaluate CEL trigger conditions and step input templates through
   `@mdbase/cel-host`
5. validate action inputs and outputs against action contracts
6. dispatch registered action handlers

The included handler set only implements `mdbase.record.patch` against an
in-memory record store. The Canvas runtime smoke test executes:

```text
canvas.drop -> canvas.zone.set-status -> mdbase.record.patch
```

The prototype does not watch files, persist run records, schedule timers, call
external providers, handle approvals, execute agents, or write Markdown files
back to disk.

## Local Verification

```bash
npm test --prefix packages/runtime-executor
```
