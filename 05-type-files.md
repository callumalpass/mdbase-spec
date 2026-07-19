# 05. Type Files

## Purpose

A v0.3 type file is a Markdown file that wraps a JSON Schema and mdbase collection
semantics.

The YAML frontmatter is machine-readable. The Markdown body documents the type
for humans and tools.

## Minimal Type

```markdown
---
kind: mdbase.type
name: task
version: 1

match:
  path_glob: "tasks/**/*.md"

schema:
  dialect: json-schema-2020-12
  value:
    $schema: "https://json-schema.org/draft/2020-12/schema"
    type: object
    required: [title]
    additionalProperties: false
    properties:
      type:
        const: task
      title:
        type: string
        minLength: 1
---

# Task

Task records live under `tasks/`.
```

## Required Frontmatter

A type file MUST include:

- `kind: mdbase.type`
- `name`
- `schema`

`version` SHOULD be present and SHOULD be a positive integer.

## Type Names

Type names are stable identifiers. They SHOULD use lower-case ASCII names with
letters, numbers, `_`, and `-`.

Tools MUST compare type names case-insensitively for matching and conflict
detection, but SHOULD preserve author-written casing when displaying a type.

## Schema Section

`schema.dialect` identifies the schema profile. v0.3 core defines:

```yaml
schema:
  dialect: json-schema-2020-12
```

The schema can be embedded:

```yaml
schema:
  dialect: json-schema-2020-12
  value:
    type: object
    properties:
      title: { type: string }
```

or referenced:

```yaml
schema:
  dialect: json-schema-2020-12
  ref: "../schemas/task.schema.json"
```

Tools implementing external references MUST define resolution relative to the
type file path and MUST prevent path traversal outside allowed collection or
package roots.

If both `value` and `ref` are present, the type is invalid unless a future
extension explicitly defines merge behavior.

## mdbase Sections

The following top-level sections are defined by v0.3:

| Section | Purpose |
| --- | --- |
| `match` | decide which records the type applies to |
| `collection` | markdown-aware collection semantics |
| `lifecycle` | mutation-time managed field policy |
| `runtime` | runtime-related annotations for this type |
| `migrations` | explicit type version migration steps |

Domain tools SHOULD use explicit extension namespaces rather than adding
domain-specific keys inside JSON Schema properties. Portable v0.3 type-file
validation allows standard core keys plus `x-*` extension sections for local,
provider-specific, or domain-specific metadata.

Example:

```yaml
x-local:
  owner: research-team

x-tasknotes:
  contract: tasknotes.task
```

This is stricter than accepting every unknown lowercase key. It lets the meta
schema catch typos such as `collecton` instead of treating them as domain
metadata.

Core mdbase MUST NOT privilege application names such as `tasknotes` in the
portable type-file schema. A future extension registry MAY define named
extension schemas, but until that mechanism exists those annotations use `x-*`.

## Meta Type

Implementations MUST have a built-in schema for validating v0.3 type files.

`init` or equivalent tooling SHOULD materialize `_types/meta.md` for inspection.
That file is itself a v0.3 type file matching `_types/**/*.md` and validating type
file frontmatter against the v0.3 type-file JSON Schema.

The built-in meta schema is authoritative during bootstrap. The materialized
`_types/meta.md` documents and mirrors that behavior.

## Type Matching

Type files MAY declare `match`.

If a record explicitly declares a type through a configured explicit type key,
that declaration controls matching and inferred match rules are skipped.

If a record does not explicitly declare a type, tools evaluate type `match`
rules to determine the matched set.

## Multiple Matched Types

v0.3 removes v0.2.x constraint merging.

If a record matches multiple types, tools validate it against every matched
type schema and every matched type's collection validators. The record is valid
only if all validations pass.

Matched type order is deterministic. Explicit declarations retain declaration
order after case-insensitive de-duplication. Inferred matches are ordered by
canonical lower-case type name.

Collection behavior from multiple matched types composes as follows:

- uniqueness rules are additive and are each evaluated in the type that
  declared them
- identical read defaults, link rules, path policies, lifecycle assignments,
  and projections coalesce
- different values for the same read-default field, link selector, path policy,
  lifecycle event/field, or projection name are `type_conflict` errors
- display metadata remains per-type; a flattened UI representation uses the
  first explicit type, or the first canonical inferred type

Implementations MUST detect these conflicts before a write and MUST NOT resolve
them by load order.

For a uniqueness rule with `scope: type`, the comparison set is every record
that matches the type which declared the rule. A record matching several types
therefore participates independently in each declaring type's uniqueness set.

## Write-Time Type Membership

Write operations determine type membership from the requested draft and target
path before lifecycle runs. Explicit type declarations continue to suppress
inferred matching.

After lifecycle has run, the implementation MUST evaluate membership again. If
the final membership differs from the pre-lifecycle membership, the operation
fails with `type_membership_changed`; implementations MUST NOT repeatedly apply
lifecycle until a fixed point. This prevents generated values from silently
changing which policies govern the operation.

An operation that intentionally changes type membership does so in its input
patch or explicit type list, not as a lifecycle side effect.

## Type Inheritance

v0.3 does not define custom type inheritance.

Reusable shape should use JSON Schema `$defs`, `$ref`, `allOf`, `anyOf`, and
`oneOf`. Reusable collection behavior should be copied, generated, or provided
through future named packs rather than hidden inheritance.

## Display Metadata

Human-facing metadata belongs in `collection.display`:

```yaml
collection:
  display:
    name_field: title
    icon: check-circle
```

JSON Schema `title` and `description` remain useful schema annotations, but
they do not define mdbase collection behavior.
