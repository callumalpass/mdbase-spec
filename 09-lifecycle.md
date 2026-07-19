# 09. Lifecycle

## Purpose

`lifecycle` defines deterministic mutation-time behavior for managed fields.

It replaces v0.2.x generated field keywords.

Lifecycle is part of write-capable mdbase behavior. It does not require the
workflow runtime.

## Events

Lifecycle policy may run on:

- `on_create`
- `on_update`
- `on_delete`
- `on_rename`

v0.3 core standardizes `on_create` and `on_update`. Other lifecycle hooks are
optional until a profile defines them.

## Example

```yaml
lifecycle:
  on_create:
    set:
      id: { ulid: true }
      dateCreated: { now: true }
      dateModified: { now: true }
  on_update:
    set:
      dateModified: { now: true }
```

## Standard Value Providers

Core lifecycle providers:

| Provider | Meaning |
| --- | --- |
| `{ now: true }` | current timestamp |
| `{ today: true }` | current date |
| `{ uuid: true }` | random UUID |
| `{ ulid: true }` | random ULID |
| `{ slugify: fieldName }` | slugified value of another field |
| `{ copy: fieldName }` | copy another field |
| `{ literal: value }` | set a literal value |

Tools MUST document timestamp precision and timezone behavior.

## Guards

Lifecycle actions MAY have CEL guards:

```yaml
lifecycle:
  on_update:
    - if: 'old.status != status'
      set:
        dateModified: { now: true }
```

If guards are supported, they use the mdbase CEL profile with these bindings:

- current draft frontmatter fields
- `old` for the previous raw frontmatter on update
- `file` for file metadata
- `operation` for operation metadata

## Validation Order

For mutating operations:

1. parse input
2. match target types
3. build a draft frontmatter object
4. apply lifecycle policy
5. validate JSON Schema
6. run collection validators
7. write the file

Lifecycle MUST run before final validation so generated IDs and timestamps can
satisfy required schema fields.

Read defaults MUST NOT run as lifecycle policy unless a write operation
explicitly asks to materialize them.

## Relationship To Workflows

Lifecycle is deterministic, local, and operation-scoped.

Workflows are event/action orchestration. They may read or write records, call
agents, request approvals, run commands, or produce run state.

Generated IDs and timestamps belong in lifecycle. Cross-record automation and
agent work belong in workflows.

## Conflicts

If multiple matched types define lifecycle policy for the same field and event,
the operation MUST be deterministic.

Normative rule:

- identical normalized assignments are allowed and execute once
- conflicting assignments are `type_conflict` errors before write
- diagnostics MUST report the type names and lifecycle paths involved

Future pack composition may define precedence, but v0.3 core MUST NOT silently
choose one policy over another.

A lifecycle guard that fails to compile or raises an evaluation error fails the
operation with `lifecycle_expression_error`. A guard that evaluates normally to
false or null skips that action.
