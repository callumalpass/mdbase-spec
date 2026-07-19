# 14. Workflows

## Purpose

A workflow is a typed Markdown record declaring how a runtime should respond to
events.

Workflows let behavior live with the collection. Tools execute declared
workflows without hardcoding every collection-specific behavior into the tool.

## Workflow Shape

Workflow records use `trigger.event` and `step.action`.

Workflow records have a strict core shape. Unknown workflow, trigger, or step
fields are errors unless they use an `x-*` extension key.

```yaml
type: workflow
id: canvas.zone.set-status
version: 1
name: Set status from canvas zone
enabled: true

triggers:
  - id: drop-on-zone
    event: canvas.drop
    if:
      $expr: 'has(event.payload.zone) && has(event.payload.file)'

steps:
  - id: patch-status
    action: mdbase.record.patch
    input:
      path:
        $expr: 'event.payload.file.path'
      patch:
        status:
          $expr: 'event.payload.zone.id'

run:
  execution:
    mode: single_executor
  idempotency:
    key:
      $expr: 'workflow.id + ":" + event.id + ":" + trigger.id'
```

Workflow records MUST NOT choose a concrete executor. Executor selection is
local deployment policy and belongs in `runtime_policy` records.

## Trigger Semantics

A trigger subscribes to an event ID.

Before execution, the runtime:

1. resolves `trigger.event` against the event registry
2. validates the delivered event envelope
3. validates the event payload against the event contract
4. verifies the event contract version and provenance
5. evaluates the trigger condition, if present

If the condition is false or null, the workflow does not run.
An expression evaluation error creates a failed run diagnostic instead of being
treated as false.

Trigger IDs MUST be unique within a workflow.

## Step Semantics

A step calls an action.

Before dispatch, the runtime:

1. resolves `step.action` against the action registry
2. evaluates `step.if`, if present
3. evaluates the step input template
4. validates the evaluated input against the action input schema
5. checks capability and policy requirements
6. dispatches the action handler
7. validates the action output against the output schema
8. records the standard step result entry in the run record

Step IDs MUST be unique within a workflow. `step.requires.providers` and
`step.requires.capabilities` are checked before dispatch.

## Expression Values

Workflow inputs can contain literals and expression objects:

```yaml
input:
  path:
    $expr: 'event.payload.file.path'
  patch:
    status: in_progress
    updated_at:
      $expr: 'now()'
```

Only objects of the form `{ $expr: "..." }` are evaluated as expressions. Plain
strings remain strings.

## Iteration

Workflows MAY support `for_each`:

```yaml
steps:
  - id: patch-each
    action: mdbase.record.patch
    for_each:
      items:
        $expr: 'event.payload.files'
      as: item
    input:
      path:
        $expr: 'item.path'
      patch:
        status: open
```

Runtimes MUST apply cost and item-count limits to iteration.

## Run Policy

Workflow `run` controls execution semantics:

```yaml
run:
  execution:
    mode: single_executor
  idempotency:
    key:
      $expr: 'workflow.id + ":" + event.id + ":" + trigger.id'
  concurrency:
    group:
      $expr: 'event.payload.file.path'
    policy: replace
  limits:
    timeout: 5m
    max_items: 100
  on_error: stop
```

`concurrency.policy` values:

- `skip`
- `queue`
- `replace`
- `allow`

`skip` declines a new run while a group is active. `queue` starts runs in event
delivery order. `replace` requests cancellation of the active run and starts
the replacement only after cancellation reaches a terminal state. An action
that cannot be cancelled may finish, so replacement is not rollback.

`execution.mode` values:

- `single_executor`: only the executor selected by runtime policy should run
  the workflow.
- `broadcast`: multiple runtimes may run the workflow.
- `best_effort`: duplicate or missed execution is acceptable; use only for
  idempotent local work.

Side-effecting workflows SHOULD default to `single_executor`.

## Executor Policy

Runtime policies choose executors for the local environment:

```yaml
type: runtime_policy
id: local.runtime
version: 1
name: Local runtime policy
executors:
  default: obsidian
  workflows:
    canvas.zone.set-status: obsidian
    repo.skill.sync: mdbase-daemon
```

Conforming runtimes that are not the selected executor for a `single_executor`
workflow may validate or preflight the workflow, but MUST NOT execute it.

Claims and leases are optional cooperative upgrades. They are not the v0.3
coordination baseline.

Events are at-least-once and may duplicate. Idempotency keys and action
preconditions are the safety boundary when duplicate events or non-conforming
tools are present.

`single_executor` coordinates executor identities, not process instances. Two
processes advertising the same executor ID can still race. A conforming runtime
MUST therefore reserve an idempotency key in a store shared by all instances
that can write the collection before dispatching the first step. The reservation
lasts at least as long as the configured event replay window. Without a shared
reservation store, the runtime MUST report that it cannot safely execute
side-effecting `single_executor` workflows.

Delivered events are ordered only within one provider stream. Cross-provider
ordering is unspecified. Runtimes MUST preserve delivery order when queuing
runs for the same concurrency group and MUST tolerate replay.

## Error Handling

Runtime failures produce standard diagnostics and step results. A failed step
does not corrupt core collection state unless an action partially completed.

A step result is embedded in the run record and contains `id`, `action`, and
`status`, with optional `output` or `error`. Status is one of `pending`,
`running`, `succeeded`, `failed`, `skipped`, `cancelled`, or `timed_out`.
Cancellation and timeout are terminal statuses and MUST NOT be collapsed into
`failed`.

Actions with external effects SHOULD report enough result detail for a human or
agent to understand what happened.

Profile 0.1 does not provide automatic retries. A provider MAY expose a retry
extension, but runtimes MUST NOT repeat an action with external effects unless
the action contract declares idempotency support or the policy explicitly
permits retry. Timeout and cancellation results remain distinct from action
failure.

## Workflow Validation Layers

Workflow validation is layered:

1. the workflow record validates against `_types/workflow.md`
2. workflow-local trigger and step IDs are unique
3. referenced event/action/capability/provider IDs resolve in the effective registry
4. event payload schemas validate delivered events
5. evaluated action inputs validate before dispatch
6. action outputs validate after dispatch
7. emitted events validate before delivery

Offline tools can perform layers 1, 2, and 3 when they have explicit or
materialized contracts.

## Built-In Workflows

A runtime MAY provide built-in workflows. Built-in workflows SHOULD be
inspectable and MAY be materialized for customization.

Collection workflows do not silently override built-in workflows unless the
runtime defines an explicit override mechanism.
