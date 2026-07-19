# 12. Operations

## Operation Model

Write-capable tools operate on Markdown files while preserving the collection
contract.

Core operations:

- read
- create
- update
- delete
- rename
- batch

## Read

Read returns a record by path, including:

- raw frontmatter
- effective frontmatter when requested
- body when requested
- file metadata
- matched type names
- diagnostics

Read MUST NOT write defaults or lifecycle values to disk.

## Create

Create builds a new record.

Pipeline:

1. determine target type or types from explicit input or path/match policy
2. build draft frontmatter
3. freeze pre-lifecycle type membership
4. apply lifecycle `on_create`
5. verify type membership did not change as a lifecycle side effect
6. validate JSON Schema
7. run collection validators
8. choose or validate path policy
9. write Markdown file
10. update derived indexes
11. emit watch/runtime events after state is consistent

Static JSON Schema defaults MAY be used by editor and create interfaces.
Validation-time mutation occurs when the create operation explicitly copies a
default into the draft.

## Update

Update modifies an existing record.

Pipeline:

1. read existing raw frontmatter
2. apply the requested patch
3. re-match and freeze types when type-affecting fields or path changed
4. apply lifecycle `on_update`
5. verify type membership did not change as a lifecycle side effect
6. validate JSON Schema
7. run collection validators
8. write frontmatter and preserve body
9. update derived indexes
10. emit watch/runtime events

If a patch sets a field to missing, the key is removed. If a patch sets a field
to null, the key is persisted as null unless the operation policy says null
means remove.

## Delete

Delete removes a record.

Tools supporting link/reference profiles SHOULD optionally report broken
backlinks before deleting.

Delete is a Core Write operation and MAY emit an event for workflow runtimes.

## Rename

Rename moves a record within the collection.

Tools MUST reject target paths that escape the collection root.

If reference updating is enabled, link updates SHOULD preserve link style,
alias, and anchor where possible. ID-based links SHOULD not be rewritten if the
target ID did not change.

Atomic reference updates across all affected files belong to a transaction
profile.

## Batch

Batch operations group operations for validation and reporting.

Recommended behavior:

- validate every operation before writing unless `allow_partial` is true
- support dry-run with full diagnostics
- report per-operation result and diagnostics
- stop on first error unless configured otherwise

## Concurrency

Write-capable tools SHOULD detect external modification between read and write
using mtime, content hash, version token, or platform-specific file identity.

On conflict, tools MUST preserve the current file and report a concurrency
diagnostic.

Successful reads MUST return a stable `revision` token derived from the raw
file state. Write operations MUST accept an optional `if_revision` token and
fail with `concurrent_modification` when it no longer matches. The token format
is implementation-defined and opaque to callers.

## Operation Result Envelope

Every operation returns a mapping with:

```yaml
valid: true
result: {}
diagnostics: []
```

`valid` is false when any error-severity diagnostic applies. Mutating results
MUST report the final path, raw persisted frontmatter, matched types, and new
revision when a record was written. Dry runs use the same envelope and MUST NOT
change files, indexes, runtime state, or revisions.

## Events

After a successful mutation, tools MAY emit watch/runtime events. Events MUST be
delivered after the derived read/query state is consistent. Watch consumers and
workflow runtimes may subscribe to the same stream.
