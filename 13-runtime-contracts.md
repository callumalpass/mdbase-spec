# 13. Runtime Contracts

## Purpose

Runtime contracts let a collection describe active behavior without baking that
behavior into every tool.

The v0.3 runtime vocabulary is:

- provider
- event
- action
- workflow
- capability
- runtime policy
- runtime run
- runtime checkpoint
- runtime diagnostic

Contracts do not implement handlers, schedulers, agents, shell execution,
provider APIs, or sandboxing.

This chapter defines runtime profile `0.1.0`. Runtime profile stability is
independent from the mdbase collection specification version.

## Contract Records

Runtime contracts may be ordinary Markdown records:

```text
providers/mdbase.md
actions/mdbase.record.patch.md
events/canvas.drop.md
capabilities/mdbase.record.write.md
workflows/canvas-zone-set-status.md
policies/local-runtime.md
```

The folder name is conventional. The record type is authoritative.

Every runtime primitive may exist in the effective registry without being
materialized as a Markdown record. Materialized records are for inspection,
documentation, local override, or collection-defined custom contracts.

Contract record schemas are strict. Unknown top-level fields are errors unless
their names begin with `x-`. Runtime-specific or provider-specific metadata
belongs under those `x-*` extension keys.

Action and event contracts contain embedded JSON Schemas. Implementations MUST
validate those embedded schemas before dispatching a workflow. A malformed
action input schema or event payload schema is a contract error, not an action
runtime error.

## Runtime Contract Packages

v0.3 SHOULD ship small helper packages that expose canonical schemas, types,
registry utilities, and a reference provider host:

- `@callumalpass/mdbase-runtime`
- `mdbase-runtime-contracts-rs`

The TypeScript package main export MUST be browser-safe. Node-specific Markdown
loading and materialization belong behind an explicit `./node` export. The Rust
package may begin as a fixture-compatible validation harness, but it should
load the same schemas and examples so Rust consumers are not downstream
afterthoughts.

The main TypeScript export MUST carry the exact canonical schemas for the
declared mdbase and runtime profile versions. Consumers MUST NOT need a source
checkout or filesystem access to validate an in-memory provider. Schema access
APIs MUST return immutable values or isolated copies so one consumer cannot
alter validation behavior for another.

Responsibilities:

- load explicit contracts from collection files or packs
- expose implicit runtime contracts supplied by a conforming runtime
- compose the effective registry
- validate event envelopes and payloads
- validate evaluated action inputs and action outputs
- resolve workflow `trigger.event`, `step.action`, and
  `requires.capabilities`
- resolve `requires.providers` against providers present in the effective
  registry
- optionally materialize implicit contracts and run/checkpoint/result records
- register and remove providers atomically
- provide a default-deny reference host for validated event delivery and action
  dispatch

Non-responsibilities:

- implementing provider action handlers
- scheduling timers
- watching files
- running shell commands
- calling provider APIs
- executing agents
- deciding approval policy

## Registry Composition

Effective registries are composed deterministically:

```text
built-in mdbase contracts
+ runtime/provider implicit contracts
+ installed pack contracts
+ collection-local explicit contracts
```

Registry types:

- provider registry
- event registry
- action registry
- capability catalog and effective capability ID set
- policy registry
- workflow set

Duplicate IDs with incompatible versions MUST be errors. Duplicate IDs with the
same version and canonically identical content coalesce while preserving all
origins for diagnostics. Any non-identical duplicate is `contract_conflict`.

Runtime profile 0.1 does not define semantic override precedence. Built-ins,
providers, packs, and collection files therefore cannot silently replace one
another. An implementation-specific override requires an `x-*` extension and
MUST make the effective contract and its origin inspectable; it is not portable
runtime-profile behavior.

Registry composition order is used only for deterministic diagnostics and
materialization: built-ins, provider contracts ordered by provider ID,
installed packs ordered by pack ID, then collection files ordered by path.
Resolution never depends on filesystem enumeration order.

## Materialization

Implicit runtime contracts can be materialized as Markdown records.

Materialization modes:

| Mode | Meaning |
| --- | --- |
| `mirror` | exported runtime truth; semantic edits are drift |
| `annotate` | runtime truth plus local documentation fields/body |
| `override` | requested runtime-specific override; non-portable in profile 0.1 |
| `custom` | collection-defined contract under its own ID |

Materializing an action, event, provider, capability, policy, run, checkpoint,
or diagnostic record does not implement runtime behavior. It makes runtime
interfaces or state inspectable.

## Provider Contract

A provider contract describes a source of implicit runtime contracts.

```yaml
type: provider
id: canvas-bases
version: 1
name: Canvas Bases
provider_version: "1.4.0"
contracts:
  events:
    - canvas.drop
```

Providers are first-class because they explain where implicit contracts come
from and let workflows or policies require a provider without requiring every
provider-owned contract to be written into the collection.

`version` is the provider contract-shape revision. `provider_version` is the
provider implementation's SemVer version. A provider MUST NOT advertise a
contract ID it cannot dispatch or emit at the declared contract version.

Provider requirements accept a string shorthand or an object:

```yaml
requires:
  providers:
    - id: tasknotes
      version: ">=4.12.0 <5.0.0"
```

The string shorthand `tasknotes` means any available provider version. Version
ranges use the SemVer comparator grammar. An unavailable or incompatible
provider is a preflight error.

## Provider Host Interface

A live provider exposes the same registry shape as materialized records:

```ts
interface RuntimeProvider {
  descriptor(): ProviderContract | Promise<ProviderContract>;
  contracts(): RuntimeContractSet | Promise<RuntimeContractSet>;
  readiness(): ProviderReadiness | Promise<ProviderReadiness>;
  subscribe(eventId: string, handler: EventHandler): Disposable;
  dispatch(actionId: string, input: unknown, context: DispatchContext): Promise<unknown>;
  dispose(): void | Promise<void>;
}
```

Registration MUST be atomic: contracts are not added to the effective registry
until the provider reports ready. Provider removal invalidates dependent
workflow preflight and prevents new dispatches.

Before registration becomes visible, the host MUST validate the provider
descriptor and every supplied contract against the canonical schema for its
record type, compile every embedded action/event schema, verify advertised
contract lists, and reject ownership conflicts. Failure leaves the effective
registry unchanged and disposes the rejected provider.

## Event Contract

An event contract declares event payload shape.

```yaml
type: event
id: canvas.drop
version: 1
provider: canvas-bases
name: Canvas drop
schemas:
  dialect: json-schema-2020-12
  payload:
    type: object
    required: [board, position]
    properties:
      board:
        type: object
      position:
        type: object
```

## Event Envelope

Delivered events use a stable envelope:

```yaml
type: canvas.drop
contract_version: 1
id: evt_01H...
occurred_at: "2026-06-14T12:00:00Z"
source:
  runtime: canvas-bases
payload:
  board:
    path: boards/work.md
  position:
    x: 120
    y: 320
```

The envelope `type` resolves against the event registry. The `payload` validates
against the event contract payload schema.

The complete envelope MUST first validate against the canonical event-envelope
schema. Payload validation and provider/version checks happen only after that
structural validation succeeds.

`contract_version` is required and MUST equal the resolved event contract
version. Event IDs are unique within the delivering runtime's deduplication
window.

The envelope source object uses known keys plus `x-*` extension keys. Event
payloads remain governed by the event contract payload schema. If
`source.provider` is present, it MUST match the resolved event contract's
`provider`.

`trace.correlation_id` groups related work. `trace.causation_id` identifies the
event or run that directly caused this event. Runtimes MUST preserve both when
dispatching actions and emitting follow-up events.

## Action Contract

An action contract declares a workflow-callable operation.

```yaml
type: action
id: mdbase.record.patch
version: 1
provider: mdbase
name: Patch record frontmatter
schemas:
  dialect: json-schema-2020-12
  input:
    type: object
    required: [path, patch]
    properties:
      path: { type: string }
      patch: { type: object }
  output:
    type: object
    required: [path, frontmatter]
    properties:
      path: { type: string }
      frontmatter: { type: object }
effects:
  - mdbase.record.write
emits:
  - mdbase.record.modified
```

A runtime may execute an action only if it has a handler for that action ID and
the caller is authorized for the required capabilities/effects.

Preflight capability resolution is advisory, not authorization. Immediately
before dispatch, the runtime MUST authorize the evaluated input and dispatch
context, including actor, workflow origin, provider, requested effects, and
resource scope. Actions with effects are denied unless an effective selected
policy explicitly allows every required capability.

The dispatch context contains at least:

```yaml
actor: { id: local-user, kind: user }
origin: { workflow: canvas.zone.set-status, path: workflows/canvas-zone-set-status.md }
run_id: run_01j0
correlation_id: corr_01j0
causation_id: evt_01j0
executor: obsidian
```

## Capability Contract

A capability is a permission or risk atom. Capability records are optional
catalog entries.

```yaml
type: capability
id: mdbase.record.write
version: 1
name: Record write
risk: medium
description: Allows modifying Markdown record frontmatter.
```

Runtimes use capabilities for preflight, local policy, and risk reporting.

Missing materialized capability records MUST NOT by itself make a workflow
invalid. Preflight checks the effective capability IDs supplied by providers,
actions, and policy. A missing or forbidden capability in that effective runtime
registry is an error.

## Runtime Policy Contract

Runtime policy records describe local deployment policy:

```yaml
type: runtime_policy
id: local.runtime
version: 1
name: Local runtime policy
executors:
  default: obsidian
  workflows:
    canvas.zone.set-status: obsidian
capabilities:
  mdbase.record.write:
    mode: allow
limits:
  workflow_timeout: 30s
```

Policy is where local executor selection belongs. Workflow records do not name
their executor. Capability policy can allow or deny a capability and attach
runtime-enforced limits. Approval-specific behavior belongs in runtime/provider
extensions rather than the core policy schema.

Runtime policies are inert until selected by local runtime configuration. A
synced collection policy file MUST NOT automatically authorize actions on a new
machine. `runtime.policy` selects one effective policy record; zero or multiple
selected policies are preflight errors for side-effecting workflows.

## Run And Checkpoint Records

Runtimes MAY materialize run state:

- run record: one workflow execution attempt
- checkpoint record: durable resumable state
- embedded step result entry: one step outcome in a run record
- diagnostic record: validation or execution issue

v0.3 defines schemas for these records so runtimes can share logs, but core
collection conformance does not require storing every transient event.

Operational run/checkpoint data defaults to `.mdbase/runtime/`, which is
excluded from ordinary collection scanning and workflow triggers. Runtimes MAY
materialize human-significant summaries as ordinary records, but MUST redact
secrets, apply retention policy, and mark their event origin so self-trigger
loops can be prevented.

Example run:

```yaml
type: runtime_run
id: run_01j0
workflow: canvas.zone.set-status
trigger_event: canvas.drop
executor: obsidian
idempotency_key: canvas.zone.set-status:evt_01j0:drop
status: succeeded
started_at: "2026-06-15T08:00:00Z"
finished_at: "2026-06-15T08:00:01Z"
steps:
  - id: patch
    action: mdbase.record.patch
    status: succeeded
```

Checkpoints are for durable waiting or resumable state, such as waiting for a
provider-specific approval response. They are not the same as claims or leases.

## Non-Core Primitive Patterns

The following ideas are intentionally not core v0.3 runtime primitives:

| Idea | v0.3 pattern | Reason |
| --- | --- | --- |
| schedule | timer/provider event | workflows already subscribe to events |
| approval | checkpoint plus policy/provider action | approval systems differ by runtime |
| secret | secret reference value handled by runtime | persisted secret records are risky |
| lease/lock | optional cooperative runtime extension | not needed for the lightweight baseline |
| artifact | action output or ordinary file | shared artifact browsing can wait |
| subscription | workflow trigger | triggers already declare event interest |

Future versions may standardize any of these if real runtimes need a portable
record shape.
