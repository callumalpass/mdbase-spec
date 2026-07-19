# 01. Concepts

## Collection

A collection is a directory tree identified by an `mdbase.yaml` file. It
contains Markdown records, type files, optional runtime records, and optional
derived state.

A collection root is the directory containing the active `mdbase.yaml`.

## Record

A record is a Markdown file in the collection that is not excluded, not a type
file, and not another reserved collection file. A record has:

- a collection-relative path
- optional YAML frontmatter
- a Markdown body
- derived file metadata such as basename, extension, folder, size, and modified
  time

The persisted frontmatter object is the raw record value. Effective read values
may additionally include `collection.read_defaults`.

## Type

A type is a Markdown file, usually under `_types/`, whose frontmatter has
`kind: mdbase.type`. The type frontmatter wraps a JSON Schema and optional
mdbase sections.

Types do not execute behavior. They define shape and collection semantics for
records that match them.

## Schema

In v0.3, "schema" means JSON Schema 2020-12 unless explicitly qualified.

`schema.value` validates persisted frontmatter object shape. mdbase-specific
sections such as `match`, `collection`, `lifecycle`, and `runtime` are outside
the JSON Schema payload.

## Match

Matching decides which type or types apply to an existing record. A record can
match no types, one type, or multiple types.

Explicit type declarations take precedence over inferred match rules. When a
record matches multiple types, it is valid only if it validates against every
matched type's JSON Schema and every matched type's mdbase collection
validators.

## Collection Semantics

Collection semantics are rules that require knowledge of the file tree or
runtime context. Examples:

- link parsing and target resolution
- cross-file uniqueness
- effective read defaults
- path generation
- display metadata
- type matching
- path safety

These rules are not JSON Schema validation.

## Lifecycle

Lifecycle policy runs during mutating operations. It can materialize managed
values such as IDs, creation timestamps, modification timestamps, slugs, and
simple transforms.

Lifecycle policy is deterministic operation behavior. It is smaller than the
workflow runtime and does not require action/event contracts.

## Expression

Portable v0.3 expressions use the mdbase CEL profile. Expressions appear in
queries, projections, runtime conditions, workflow input templates, and optional
lifecycle guards.

`match.where` is intentionally a small structured predicate language and does
not require the full CEL engine.

## Link

A link is a frontmatter value or body reference that can resolve to another
record. mdbase recognizes wikilinks, Markdown links, and bare path strings where
a field is declared as link-aware.

JSON Schema validates the local string or array shape. `collection.links`
declares link meaning, target type, and existence requirements.

## Runtime

A runtime is a process, plugin, daemon, CLI, CI job, or agent that executes
runtime-profile behavior for a collection.

The core collection model is runtime-neutral. Runtime records make active
behavior portable and inspectable without making every implementation a runtime.

## Contract

A contract is a typed record or virtual registry entry describing the interface
of a provider, event, action, capability, policy, run, checkpoint, diagnostic,
or workflow.

Contracts describe interfaces. They do not by themselves implement action
handlers, watchers, schedulers, agents, or provider APIs.

## Explicit And Implicit Contracts

Explicit contracts are ordinary Markdown records in a collection or installed
pack.

Implicit contracts are supplied by a conforming runtime, for example built-in
file events or core record actions. A runtime may materialize implicit
contracts as Markdown records for inspection or offline tooling.
