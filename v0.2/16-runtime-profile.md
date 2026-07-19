---
type: chapter
id: 16-runtime-profile
title: "Runtime Profile"
description: "Draft optional profile for active collections, workflows, actions, events, and capabilities"
section: 16
normative: false
depends_on:
  - "[[05-types]]"
  - "[[08-links]]"
  - "[[11-expressions]]"
  - "[[15-watching]]"
---

# 16. Runtime Profile

This section is a draft optional profile. It is not part of Levels 1-6 conformance.

The runtime profile defines how an implementation can treat a typed markdown collection as an active system: events arrive, workflows match those events, actions execute, records change, and runs are recorded for inspection.

The core mdbase specification remains file-first and runtime-neutral. A collection can be fully conforming without implementing this profile.

---

## 16.1 Purpose

The core specification gives tools a shared model for records, types, validation, queries, links, operations, caches, and watch events. That is enough for a passive typed markdown database.

Many useful systems need an additional active layer:

- Watch a collection and react to changes
- Run scheduled checks
- Trigger agent or script work when records match a condition
- Request human approval before public or destructive actions
- Keep run logs and artifacts that explain what happened
- Validate workflows against the actions and events they reference

The runtime profile standardizes the contracts for that active layer without requiring every mdbase implementation to become a scheduler, server, or automation engine.

---

## 16.2 Design Principles

**Core stays passive.** Runtime support is layered on top of the collection model. It MUST NOT change the meaning of frontmatter parsing, type validation, querying, links, or CRUD operations.

**Files remain the source of truth for durable user intent.** User-authored workflow and policy records SHOULD be markdown files in the collection or in an installed pack. A runtime MAY also provide runtime-owned workflows for built-in policy behavior. Action, event, and capability contracts MAY be explicit markdown records, but a runtime MAY also provide them from its own built-in or provider-owned registry. Runtime indexes, queues, leases, and run logs MAY use derived storage.

**Contracts are separate from implementations.** An action contract defines what an action means. Runtime instances decide which action IDs they implement and how those actions are executed. A contract can exist logically even when it has not been materialized as a markdown file.

**Materialized contracts do not redefine runtime implementations.** Exporting a runtime-owned action, event, or capability contract makes the interface visible. It does not change what the runtime emits or executes unless that runtime explicitly supports a non-portable override mechanism.

**Runtimes may differ.** A desktop plugin, headless server, command-line daemon, CI job, and coding agent can all be runtimes. They SHOULD agree on portable contracts, but MAY support different actions and capabilities.

**Policies may be workflows.** User-configurable policy and orchestration behavior MAY be modeled as workflows, including default behavior supplied by a runtime. Core domain invariants, low-level indexing, migrations, cache updates, and transactional operations SHOULD remain implementation code exposed through actions or runtime APIs.

**Scripts are explicit workflow steps.** Local scripts and commands SHOULD use a generic action such as `command.run` rather than hidden implementation records.

---

## 16.3 Runtime Concepts

| Concept | Description |
|---------|-------------|
| Runtime | A process or agent that loads a collection and executes runtime-profile behavior |
| Provider | A namespace that supplies actions, events, or capabilities |
| Event | A runtime payload representing something that happened |
| Event contract | A runtime-registry entry or record that defines an event's stable identifier and payload shape |
| Action | A named operation that a workflow step can execute |
| Action contract | A runtime-registry entry or record that defines an action's input, output, effects, emitted events, and required capabilities |
| Workflow | A workflow record or runtime-owned behavior that declares triggers, conditions, steps, and run policy |
| Capability | A permission/risk atom used to validate and authorize actions |
| Run | A concrete workflow execution attempt |
| Step result | The standard envelope produced by every executed step |
| Artifact | A file, log, patch, screenshot, prompt, response, or other run output captured for inspection |

---

## 16.4 Runtime Records

Runtime-profile declarations MAY be ordinary typed mdbase records.

Implementations MAY ship standard type definitions for:

- `event`
- `action`
- `workflow`
- `capability`
- `runtime_policy`

These are called runtime system types. They are not part of the built-in `meta` type required by §5.8, but a runtime implementation SHOULD provide templates, pack records, or an equivalent registry export for them.

Action, event, and capability contracts do not have to be stored in the collection for normal workflow execution. For example, a TaskNotes runtime may know the `tasknotes.task.updated` event and `tasknotes.task.archive` action internally. A workflow can reference those IDs without requiring the corresponding contract files to be present in the vault.

Explicit contract records are still valuable when:

- a workflow should be portable across runtimes
- an LSP or CLI should validate workflow inputs without connecting to the runtime
- a runtime wants to document its supported surface in the collection
- a coding agent or other non-deterministic runtime needs machine-readable instructions for what actions and events mean
- a pack wants to publish provider contracts independently of any one runtime implementation

Workflow records follow a related pattern. A runtime MAY provide virtual workflows for built-in policy behavior without storing those workflows in the collection. Such workflows SHOULD be inspectable and MAY be materialized as markdown records when a user wants to customize, disable, replace, package, or audit them.

Runtime-owned workflows SHOULD be used for configurable behavior, not for core invariants. For example, a task runtime might implement `task.archive` in code, emit `tasknotes.task.archived`, and then run a default workflow that moves the archived note to an archive folder. The domain operation remains code; the surrounding policy can be a workflow.

### Identifier Fields

Runtime records SHOULD use the collection's configured `id_field` for stable references. With the default `id_field: "id"`, an action record can be referenced by `[[ops.github.getDirtyIssues]]` if its frontmatter contains:

```yaml
type: action
id: ops.github.getDirtyIssues
```

Portable references SHOULD use stable IDs. Wikilinks MAY be used for human-friendly references and existing link validation, but workflows MAY also use plain action/event IDs where a workflow-aware validator resolves them against the registry.

---

## 16.5 Registry Composition

A runtime builds registries before validating or executing workflows:

```text
built-in runtime contracts
+ installed provider contracts
+ collection contracts
+ enabled pack contracts
```

Registry entries MAY be virtual or materialized.

A **virtual contract** is supplied by the runtime or provider without a markdown record in the collection. A deterministic runtime can use virtual contracts for built-in actions and events that it already understands.

A **materialized contract** is represented as an `action`, `event`, or `capability` record in the collection or in an installed pack. Materialized contracts make the runtime surface inspectable, portable, and available to tools that are not connected to the executing runtime.

Runtimes SHOULD expose the effective registry after composition. They MAY also provide a way to materialize virtual contracts into markdown records for inspection, packaging, or offline validation.

Example commands:

```bash
mdbase runtime actions
mdbase runtime events
mdbase runtime export-contracts ./_runtime/contracts
```

The resulting contract registries are:

- Event registry
- Action registry
- Capability registry

If two registry entries define the same stable ID and incompatible versions, the runtime MUST treat the registry as invalid. If two registry entries define the same stable ID and the same version, the runtime MAY reject them, choose by precedence, or require an explicit override policy.

Registry composition MUST be deterministic.

A runtime MAY also build an effective workflow set:

```text
built-in runtime workflows
+ installed workflow packs
+ collection workflow records
```

Runtime-owned workflows MAY be virtual or materialized. Collection workflow records SHOULD have precedence over runtime-owned default workflows only when the runtime defines an explicit override mechanism. If a collection workflow has the same stable ID as a runtime-owned workflow and no override mechanism is defined, the runtime SHOULD treat the duplicate as a configuration error rather than silently running both.

Runtimes SHOULD expose the effective workflow set and SHOULD indicate which workflows are built-in, pack-provided, or collection-defined.

Example commands:

```bash
mdbase runtime workflows
mdbase workflow inspect tasknotes.archive.move_to_archive_folder
mdbase runtime export-workflows ./workflows/runtime-defaults
```

### Contract Modes

Workflows SHOULD NOT need to declare a contract mode for ordinary use. By default, a workflow-aware validator MAY resolve action and event IDs from the current runtime's effective registry, whether those contracts are virtual or materialized.

Implementations MAY support stricter modes:

| Mode | Meaning |
|------|---------|
| `runtime` | Resolve contracts from the current runtime's effective registry. This is the default. |
| `materialized` | Prefer or require exported contract records for inspection and offline tooling. |
| `strict` | Require every referenced action, event, and capability contract to resolve from explicit files or installed packs. |

Strict contract resolution is useful for portable workflow packages and for agents that need the vault itself to describe the available affordances.

### Contract Materialization Semantics

Materializing a runtime-owned contract makes the runtime's interface inspectable. It does not make the materialized file the source of truth for the runtime implementation.

For runtime-owned action and event contracts, semantic fields include:

- `inputSchema`
- `outputSchema`
- `payloadSchema`
- `requires`
- `effects`
- `emits`
- `version`

For runtime-owned capability contracts, fields used for authorization, risk classification, or policy matching are also semantic.

If a materialized runtime-owned contract changes semantic fields, the runtime SHOULD treat the record as drifted or incompatible unless it explicitly supports contract overrides. It SHOULD NOT silently use edited schemas to validate an implementation that still behaves according to its built-in contract.

Runtimes MAY allow local annotations on materialized contracts. Annotation fields and markdown body text can add notes, examples, documentation, links, or local operational guidance without changing the contract semantics.

Recommended materialization modes:

| Mode | Meaning |
|------|---------|
| `mirror` | Exported runtime truth. Semantic edits are ignored with a warning or reported as drift. |
| `annotate` | Runtime truth plus local notes or examples. Semantic fields still come from the runtime. |
| `override` | Runtime-specific validation override. Non-portable and only valid when the runtime explicitly supports it. |
| `custom` | A collection- or pack-defined contract under its own ID. The runtime can execute it only if it supports that ID or the workflow calls a generic action such as `command.run`. |

Materialized workflows are different. A workflow is policy behavior, so editing a materialized workflow MAY change what happens when the runtime defines an override or replacement mechanism. Materialized action and event contracts are interface descriptions; editing them SHOULD NOT redefine a deterministic runtime's behavior.

---

## 16.6 Event Contracts

An event contract defines the shape of an event a runtime or provider can emit.

Example:

```yaml
---
type: event
id: schedule.interval.fired
version: 1
provider: mdbase
name: Interval fired
description: Emitted when an interval trigger fires.

payloadSchema:
  type: object
  required: [scheduledAt, actualAt, workflowId, triggerId]
  fields:
    scheduledAt:
      type: datetime
    actualAt:
      type: datetime
    workflowId:
      type: string
    triggerId:
      type: string
    missedRuns:
      type: integer
      default: 0
---
```

### Standard Event Envelope

Every delivered event SHOULD have this envelope:

```yaml
id: evt_01j...
type: schedule.interval.fired
version: 1
source: mdbase-runtime
occurredAt: "2026-06-12T10:30:00Z"
correlationId: corr_01j...
payload:
  scheduledAt: "2026-06-12T10:30:00Z"
  actualAt: "2026-06-12T10:30:01Z"
  workflowId: tasknotes_ops_review_dirty_issues
  triggerId: every_30m
```

`type` identifies the event contract. `payload` MUST validate against the contract's `payloadSchema` when the contract is known, whether that contract is virtual or materialized.

### Event Namespaces

Event IDs SHOULD be namespaced by provider or domain:

- `mdbase.file.created`
- `mdbase.record.updated`
- `schedule.interval.fired`
- `workflow.completed`
- `tasknotes.task.updated`
- `pickle.request.answered`
- `obsidian.file.opened`

---

## 16.7 Action Contracts

An action contract defines a workflow-callable operation.

Example:

```yaml
---
type: action
id: ops.github.getDirtyIssues
version: 1
provider: ops
name: Get dirty GitHub issues
description: Find GitHub issues missing from or dirty in an ops registry.

requires:
  capabilities:
    - github.issue.read
    - ops.registry.read
    - ops.registry.write

inputSchema:
  type: object
  required: [repo, opsRoot]
  fields:
    repo:
      type: string
    opsRoot:
      type: string
    state:
      type: enum
      values: [open, closed, all]
      default: open
    limit:
      type: integer
      default: 250

outputSchema:
  type: object
  required: [repository, missingIssues, updatedIssues, duplicateIssues, syncSummary]
  fields:
    repository:
      type: string
    missingIssues:
      type: list
      items:
        type: object
        fields:
          provider:
            type: string
          kind:
            type: string
          key:
            type: string
          externalRef:
            type: string
          repo:
            type: string
          number:
            type: integer
          remoteState:
            type: string
          remoteTitle:
            type: string
          remoteAuthor:
            type: string
          remoteUrl:
            type: string
          remoteUpdatedAt:
            type: datetime
    updatedIssues:
      type: list
      items:
        type: integer
    duplicateIssues:
      type: list
      items:
        type: integer
    syncSummary:
      type: object
      fields:
        changed:
          type: integer
        missing:
          type: integer
        duplicates:
          type: integer
        exitStatus:
          type: integer

effects:
  - ops.registry.write

emits:
  - ops.github.dirtyIssuesFound
---
```

### Outputless Actions

Some actions exist primarily for side effects. Examples include sending a notice, creating an approval request, running a coding agent, or posting a GitHub comment.

Such actions SHOULD still be explicit about their lack of domain output. Use `outputSchema: null` when the action has no domain output:

```yaml
outputSchema: null
```

`outputSchema: null` is a runtime-profile sentinel, not an mdbase field type. Every step still produces a standard step result envelope (§16.10). `outputSchema: null` means the `output` field has no domain value; it does not mean the step has no status, artifacts, effects, or errors.

### Action Namespaces

Action IDs SHOULD be namespaced:

- `mdbase.record.create`
- `mdbase.record.patch`
- `mdbase.record.move`
- `mdbase.query.run`
- `pickle.request.create`
- `tasknotes.task.archive`
- `canvas.canvas.moveCard`
- `github.issue.close`
- `agent.run`
- `command.run`

If semantics depend on a provider, the provider SHOULD appear in the action ID.

---

## 16.8 Runtime Action Support

Action execution is a runtime concern. It does not need to be represented as portable markdown records.

A runtime SHOULD expose which action IDs it supports:

```yaml
runtime: mdbase-rs
supports:
  actions:
    - mdbase.record.patch
    - mdbase.query.run
    - command.run
    - agent.run
    - pickle.request.create
```

If a workflow references an unsupported action, the runtime MUST refuse to execute that workflow and SHOULD report the unsupported action during validation or preflight checks.

For built-in or provider actions, the runtime executes the action directly. For local scripts and commands, workflows SHOULD call a generic action such as `command.run` with explicit command input.

The runtime MUST validate action input before execution when the action contract defines `inputSchema`. The runtime MUST validate action output after execution when the action contract defines `outputSchema`. These requirements apply equally to virtual contracts and materialized contracts.

---

## 16.9 Workflows

A workflow declares triggers, conditions, steps, and run policy. A workflow is usually a typed markdown record, but a runtime MAY also provide runtime-owned workflows for built-in policy behavior.

Example:

```yaml
---
type: workflow
schemaVersion: 1
id: tasknotes_ops_review_dirty_issues
name: TaskNotes ops review dirty issues
enabled: true

requires:
  capabilities:
    - github.issue.read
    - ops.registry.read
    - ops.registry.write
    - agent.run

triggers:
  - id: every_30m
    type: schedule.interval
    every: 30m

conditions: []

steps:
  - id: dirty
    type: ops.github.getDirtyIssues
    input:
      repo: callumalpass/tasknotes
      opsRoot: /home/calluma/projects/tasknotes/.ops
      state: open
      limit: 500

  - id: triage
    type: agent.run
    if:
      $expr: >
        steps.dirty.output.missingIssues.length > 0 ||
        steps.dirty.output.updatedIssues.length > 0 ||
        steps.dirty.output.duplicateIssues.length > 0
    input:
      prompt: tasknotes.ops.triage
      payload:
        $expr: steps.dirty.output

run:
  mode: sequential
  concurrency:
    group: workflow
    policy: skip
  limits:
    timeout: 4h
    maxItems: 500
  onError: stop
---
```

### Runtime-Owned Workflows

A runtime-owned workflow is a workflow supplied by the runtime without requiring a workflow file in the collection. Runtime-owned workflows are useful for default product behavior that is event-driven, policy-like, and reasonable for users to inspect or customize.

Runtime-owned workflows SHOULD be materializable. When materialized, the workflow SHOULD use the same shape as user-authored workflow records so it can be disabled, edited, copied into a pack, or validated by offline tools.

Example materialized default workflow:

```yaml
---
type: workflow
schemaVersion: 1
id: tasknotes.archive.move_to_archive_folder
name: Move archived task notes to archive folder
enabled: true

requires:
  capabilities:
    - task.read
    - record.move

triggers:
  - id: task_archived
    type: tasknotes.task.archived

vars:
  archiveFolder: TaskNotes/Archive

steps:
  - id: move_note
    type: mdbase.record.move
    input:
      path: "{{event.payload.path}}"
      folder: "{{vars.archiveFolder}}"

run:
  mode: sequential
  concurrency:
    group: "{{event.payload.path}}"
    policy: skip
  onError: stop
---
```

This workflow is not the definition of `task.archive`. The runtime still implements the archive operation and its invariants in code. The workflow models configurable follow-up policy after a `tasknotes.task.archived` event.

Runtime-owned workflows are appropriate for:

- default reactions to domain events
- optional notification, filing, labeling, approval, or cleanup policies
- product behavior that users may reasonably want to disable, copy, or customize
- compatibility shims that migrate older automation into workflow form

Runtime-owned workflows are usually not appropriate for:

- domain invariants that must always hold
- low-level indexing, cache maintenance, or migrations
- transactional operations that must be atomic
- internal repair logic whose partial execution would corrupt state

### Workflow Context

Expressions inside a workflow receive these root objects:

| Root | Meaning |
|------|---------|
| `workflow` | Static workflow metadata |
| `trigger` | The trigger definition that matched |
| `event` | The runtime event payload that arrived |
| `vars` | Static workflow variables |
| `steps` | Prior step result envelopes keyed by step ID |
| `item` | Current loop item, when inside `forEach` |

When a workflow is about a current file or record, runtimes SHOULD also expose familiar query roots where possible:

- `file`
- `note`
- provider-specific aliases such as `task`

### Trigger vs Event

`trigger` and `event` are distinct.

`trigger` is the configured workflow trigger that matched:

```yaml
trigger.id
trigger.type
trigger.every
```

`event` is the runtime payload that arrived:

```yaml
event.type
event.payload
event.occurredAt
event.source
```

Workflow authors SHOULD use `event.*` for runtime data and `trigger.*` for configuration.

---

## 16.10 Step Results

Every step MUST produce a result envelope, even if the action has no domain output.

```yaml
id: dirty
type: ops.github.getDirtyIssues
status: succeeded
startedAt: "2026-06-12T10:30:01Z"
endedAt: "2026-06-12T10:30:04Z"
output:
  repository: callumalpass/tasknotes
  missingIssues: []
  updatedIssues: [2023]
  duplicateIssues: []
  syncSummary:
    changed: 1
    missing: 0
    duplicates: 0
error: null
artifacts: []
effects:
  - type: ops.registry.write
    paths:
      - .ops/items/github-issue-2023.md
events: []
```

### Step Status Values

Recommended statuses:

- `pending`
- `running`
- `succeeded`
- `skipped`
- `failed`
- `cancelled`
- `timed_out`

### Output Access

Later steps access action output through the result envelope:

```text
steps.dirty.output.missingIssues
steps.dirty.status
steps.dirty.error
```

This ensures skipped and failed steps have stable expression semantics.

---

## 16.11 Expressions and Interpolation

Workflow expressions SHOULD use the mdbase expression language (§11).

Use `$expr` when a value is computed:

```yaml
date:
  $expr: 'date(event.after.due) - duration("7d")'
```

Use `{{...}}` only for simple path interpolation inside strings:

```yaml
message: "Scheduled review for {{event.after.title}}"
```

Implementations SHOULD NOT treat `{{...}}` fragments as full expressions unless explicitly documented. Full computation SHOULD use `$expr`.

---

## 16.12 Loops

Steps MAY define `forEach` to execute once per item.

Canonical form:

```yaml
forEach:
  items:
    $expr: 'steps.overdue.output.tasks.filter(value.priority == "high")'
  as: task
input:
  task: "{{task.path}}"
```

Inside the loop:

- `item` refers to the current item
- the optional `as` value creates an additional named alias

Nested loops SHOULD use explicit `as` aliases.

---

## 16.13 Run Policy

The `run` block declares workflow execution policy.

```yaml
run:
  mode: sequential
  concurrency:
    group: workflow
    policy: skip
  limits:
    timeout: 5m
    maxItems: 50
  onError: stop
```

Recommended fields:

| Field | Description |
|-------|-------------|
| `mode` | `sequential` initially; runtimes MAY support `parallel` |
| `concurrency.group` | Locking/grouping key, such as `workflow`, `trigger`, or an expression |
| `concurrency.policy` | `skip`, `queue`, `replace`, or `allow` |
| `limits.timeout` | Maximum run duration |
| `limits.maxItems` | Maximum loop items |
| `onError` | `stop` or `continue` |

---

## 16.14 Capabilities and Policy

A capability is a named permission or risk atom.

Examples:

- `record.read`
- `record.query`
- `record.create`
- `record.patch`
- `record.delete`
- `workflow.run`
- `approval.request`
- `agent.run`
- `command.run`
- `network.http`
- `github.issue.read`
- `github.issue.write`
- `secret.read`

Action contracts SHOULD declare required capabilities. Workflows MAY declare the minimum capabilities they expect to need. Runtime policy decides which capabilities are granted.

Example policy:

```yaml
---
type: runtime_policy
id: local_tasknotes_ops_policy
runtime: mdbase-rs

grants:
  - capability: github.issue.read
    to: workflow:tasknotes_ops_review_dirty_issues
  - capability: ops.registry.write
    to: workflow:tasknotes_ops_review_dirty_issues
  - capability: agent.run
    to: workflow:tasknotes_ops_review_dirty_issues

denies:
  - capability: command.run
    to: "*"
---
```

This profile defines capability contracts and validation. It does not define a complete security model.

---

## 16.15 Command Actions

Command actions are useful for local automation and migration from existing systems.

Workflows SHOULD call a generic action such as `command.run` when a step needs to execute a local script or command.

Example:

```yaml
steps:
  - id: dirty
    type: command.run
    input:
      command:
        - /home/calluma/.config/tickle/scripts/tasknotes-ops/has-unseen-or-updated-issues.sh
      cwd: /home/calluma/projects/tasknotes
      stdout: json
      timeout: 2m
      result:
        successExitCodes: [0]
        skipExitCodes: [1]
        outputPath: payload
        dedupeKeyPath: event_id
```

Recommended command rules:

- Command arguments SHOULD be an argv list, not a shell string
- `cwd` SHOULD be explicit
- Environment variables SHOULD be explicit
- Timeout SHOULD be required or have a conservative default
- Stdout MAY be parsed as JSON
- Stderr SHOULD be captured as an artifact
- Exit code semantics SHOULD be declared
- Parsed output SHOULD be available through the normal step result envelope

Typical script trigger/result convention:

```json
{
  "run": true,
  "reason": "1 unseen GitHub issue",
  "event_id": "tasknotes-ops:141d9533ec2b7242",
  "payload": {
    "repository": "callumalpass/tasknotes",
    "missingIssues": []
  }
}
```

In the runtime profile, `command.run` should usually normalize this into:

- a step result `status`
- a dedupe or correlation key
- an action `output`
- optional emitted events

---

## 16.16 Runs, Leases, and Journals

Runtime state MAY be stored outside markdown files.

Recommended derived runtime storage:

- Run index
- Run artifacts
- Event queue
- Workflow scheduler state
- Runtime lease
- Write journal

These files SHOULD live under an implementation-defined runtime directory such as `.mdbase/runtime/`.

### Runtime Lease

A runtime lease advertises which runtime currently has authority for workflow execution or writes:

```yaml
instanceId: rt_01j...
role: server
apiUrl: "http://127.0.0.1:8788"
pid: 12345
host: dev-vm
workflows: enabled
writes: authoritative
startedAt: "2026-06-12T10:00:00Z"
heartbeatAt: "2026-06-12T10:30:00Z"
```

The lease is advisory. It MUST NOT prevent users from editing files directly in tools such as text editors, Obsidian, Git, or shell scripts.

### Write Journal

Runtime writes SHOULD be journaled with:

- Operation ID
- Actor
- Correlation ID
- Paths touched
- Before and after content hashes
- Changed fields when known
- Started and ended timestamps

Watchers can use the journal to distinguish runtime-originated writes from external filesystem writes and to avoid event loops.

---

## 16.17 Workflow Validation

Runtime-profile validation has three layers.

### Structural Validation

Normal mdbase validation checks whether runtime records have the right local shape:

- materialized workflow records match the `workflow` type
- materialized action records match the `action` type
- materialized event records match the `event` type
- link fields resolve when `validate_exists: true`

Structural validation does not require a runtime connection. It can confirm that a materialized workflow is syntactically well-shaped even when action and event contracts are implicit.

### Runtime-Aware Validation

A workflow-aware validator checks the workflow against the current runtime's effective registry:

1. Workflow IDs are unique within the runtime's effective workflow set, or duplicate IDs are resolved by an explicit override policy
2. Trigger types and referenced event types exist in the registry
3. Step action types exist in the action registry
4. Step input objects validate against the action's `inputSchema`
5. Later expressions only access known prior step output fields where statically knowable
6. Workflow conditions type-check against known `workflow`, `trigger`, `event`, `vars`, and `steps` contexts where possible
7. Required capabilities are known
8. Runtime policy can grant required capabilities
9. The runtime supports every action referenced by the workflow

Static validation MAY be incomplete when values are computed with `$expr`. Runtimes MUST still validate inputs and outputs at execution time when schemas are known.

### Portable Validation

Portable validation checks a workflow package without assuming a particular runtime process is available. In this mode, referenced contracts SHOULD resolve from materialized `action`, `event`, and `capability` records in the collection or in installed packs.

Portable validation is stricter than runtime-aware validation. It is useful for:

- publishing workflow packs
- validating workflows in CI
- helping coding agents understand available events and actions without deterministic built-in runtime support
- checking whether another runtime could plausibly implement the workflow

The practical rule is:

```text
implicit contracts = runtime-owned knowledge
explicit contracts = portable, inspectable knowledge
virtual workflows = runtime-owned behavior
materialized workflows = user-visible, configurable behavior
```

Recommended commands:

```bash
mdbase workflow validate workflows/tasknotes-ops.md
mdbase workflow explain tasknotes_ops_review_dirty_issues
mdbase action inspect ops.github.getDirtyIssues
mdbase runtime check
```

---

## 16.18 Relationship to Watch Events

Watch events from §15 can be adapted into runtime events.

For example, a `file_modified` watch event MAY be converted into an `mdbase.file.modified` runtime event with a standard event envelope. Runtime events have additional fields for source, correlation, and delivery semantics.

Runtimes SHOULD ensure cache updates complete before workflow conditions or actions query the collection, preserving the guarantee from §15.7.

---

## 16.19 Relationship to Views

Views such as `.base` files or client-specific dashboards are outside this profile unless they trigger actions.

A client MAY render workflows as interactive UI. For example, a canvas active zone can be modeled as a workflow whose trigger is a client UI event and whose steps execute actions.

The portable contract is the workflow plus its action and event contracts. Those contracts may be runtime-owned for ordinary execution or materialized as records for portability and offline tooling. The visual surface that edits or invokes them is client-specific.

---

## 16.20 Open Questions

This draft leaves the following questions intentionally open:

- Which runtime system types and contracts should be standardized in this repository
- Whether workflow step references should use links, plain IDs, or a future `ref` field type
- Whether `inputSchema` and `outputSchema` should use mdbase field definitions, JSON Schema, or a constrained subset of both
- How much expression type inference is required for LSP-quality workflow validation
- How run logs should be exported or materialized for human inspection
- Which runtime events and actions should be standard across providers
- Which runtime-owned workflows should be standard defaults, and how overrides should be declared
- Whether any runtime-profile features should eventually become a new conformance level

Until these are resolved, this section should be treated as an implementation guide and interoperability target, not a conformance requirement.
