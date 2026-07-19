# `@callumalpass/mdbase-runtime`

Portable TypeScript package for mdbase runtime profile `0.1.0`.

The main export is browser-safe. It provides runtime contract types and the
reference in-memory provider host without importing Node, Obsidian, or
TaskNotes APIs:

```ts
import { InMemoryRuntimeHost } from "@callumalpass/mdbase-runtime";
```

The same entry point exposes isolated copies of every canonical v0.3 schema, so
browser and plugin hosts validate against the exact spec artifacts without
reading from the filesystem:

```ts
import { getCanonicalSchemas } from "@callumalpass/mdbase-runtime";

const schemas = getCanonicalSchemas();
```

Use `validateCanonicalSchema(name, value)` when a host needs validation without
constructing its own Ajv registry.

Markdown loading and materialization use Node APIs and are isolated behind the
explicit Node export:

```ts
import { loadRuntimeContracts } from "@callumalpass/mdbase-runtime/node";
```

This package is intentionally not a workflow engine. It helps tools understand
and host runtime contracts enough to register providers, lint, preflight,
validate, dispatch actions, deliver events, and materialize contracts.

## What It Does

- loads runtime records from a collection
- validates type files and runtime records against `schemas/v0.3`
- validates embedded action/event JSON Schemas before runtime use
- embeds and exposes the exact canonical v0.3 schemas in the browser package
- composes provider, action, event, capability, workflow, and policy registries
- exposes materialized run, checkpoint, and diagnostic records without adding
  them to the executable registry
- resolves workflow `trigger.event`, `step.action`, capability references, and
  provider requirements
- treats materialized capability records as optional catalog metadata while
  resolving effective capability IDs from providers and actions
- validates provider contracts, delivered event envelopes, and event payloads
  against the canonical schemas
- validates evaluated action inputs and action outputs
- registers and removes live providers atomically
- validates and dispatches provider actions under explicit capability policy
- validates and delivers provider events with deduplication
- materializes a contract object back to Markdown
- exposes `loadRuntimeContracts()` as the reference one-call loader for
  collection parse, registry composition, and workflow preflight

## What It Does Not Do

- execute workflows
- watch files
- schedule timers
- call provider APIs
- run agents or shell commands
- enforce provider-specific approval systems

## Local Verification

```bash
npm test --prefix packages/runtime-contracts
```

The test suite loads `examples/v0.3/canvas-runtime`, composes the registry,
preflights `canvas.zone.set-status`, validates the sample `canvas.drop` event,
validates the evaluated `mdbase.record.patch` input, checks contract
materialization, and covers malformed contracts.

## Example

```ts
import { loadRuntimeContracts } from "@callumalpass/mdbase-runtime/node";

const result = await loadRuntimeContracts("examples/v0.3/canvas-runtime");

if (!result.valid) {
  console.error(result.diagnostics);
}
```

Use `RuntimeContractValidator` directly when a tool needs lower-level access to
parsing, registry composition, event envelope validation, or action input/output
validation.

## Provider Authoring

Implement `MdbaseRuntimeProvider` from the browser-safe main export. A provider
returns one descriptor, the exact contracts advertised by that descriptor, a
readiness result, event subscriptions, action dispatch, and disposal:

```ts
import type { MdbaseRuntimeProvider } from "@callumalpass/mdbase-runtime";

const provider: MdbaseRuntimeProvider = {
  descriptor: () => ({
    type: "provider",
    id: "example",
    version: 1,
    name: "Example provider",
    provider_version: "0.1.0",
    contracts: { events: ["example.changed"] },
  }),
  contracts: () => [exampleChangedEvent],
  readiness: () => ({ valid: true, status: "ready", diagnostics: [] }),
  subscribe: (eventId, handler) => subscribeExample(eventId, handler),
  dispatch: async () => {
    throw new Error("This provider exposes no actions.");
  },
  dispose: () => disposeExample(),
};
```

The selected platform host owns registration and policy. Providers do not create
their own global host and do not discover the generic runtime through TaskNotes.
See `release/v0.3.0-operator-guide.md` for registration, policy, test, workflow,
and publication requirements.
