# 07. Collection Semantics

## Purpose

`collection` holds behavior that depends on the Markdown collection rather than
only on a single frontmatter object.

```yaml
collection:
  display:
    name_field: title
  read_defaults:
    status: open
  unique:
    - field: id
      scope: type
  links:
    assignee:
      target_type: person
      validate_exists: true
```

## Matching

`match` decides when a type applies to an existing record.

```yaml
match:
  path_glob: "tasks/**/*.md"
  fields_present: [title]
  where:
    status:
      neq: done
```

`match.where` is a structured predicate language. It SHOULD support simple
field comparisons without requiring a CEL engine.

The v0.3 structured predicate grammar is normative. A `where` mapping combines
different fields with AND. A direct value uses deep JSON equality. An operator
mapping combines its operators with AND and supports:

| Operator | Meaning |
| --- | --- |
| `eq`, `neq` | deep JSON equality or inequality |
| `gt`, `gte`, `lt`, `lte` | number, string, date, time, or date-time comparison |
| `contains` | string substring or array item equality |
| `containsAll`, `containsAny` | array contains all/any requested values |
| `startsWith`, `endsWith` | string prefix or suffix |
| `matches` | portable regular-expression match |
| `exists` | raw key presence, including an explicit null value |

Except for `exists`, every operator returns false for a missing or null field.
Ordering operators return false for incomparable types. `neq` returns false for
missing values rather than treating missing as unequal. `matches` uses the same
portable regular-expression subset as JSON Schema `pattern`: Unicode-aware,
without backreferences or look-around. Unsupported expressions are type-file
diagnostics, not silent non-matches.

If a type needs more expressive inferred matching, it MAY declare `match.expr`
with a CEL expression object:

```yaml
match:
  expr:
    $expr: 'file.inFolder("tasks") && tags.exists(t, t == "task")'
```

`match.expr` belongs to the CEL Match profile. Tools that do not implement that
profile MUST reject a type using it with `unsupported_profile`; they MUST NOT
silently ignore the expression.

Fields with explicit `null` do not count as present for `fields_present`.
Empty string, `false`, zero, and empty list do count as present.

## Explicit Type Declarations

If a record contains a configured explicit type key, inferred matching is
skipped.

With default config:

```yaml
type: task
```

or:

```yaml
types: [task, publishable]
```

Type names are matched case-insensitively.

## Read Defaults

`collection.read_defaults` defines effective read/query values for missing
fields.

```yaml
collection:
  read_defaults:
    status: open
    recurrenceAnchor: scheduled
```

Rules:

- applies only when the raw field is missing
- does not replace explicit `null`
- does not satisfy JSON Schema `required`
- does not make the key present for raw-frontmatter checks
- is not written to disk by read/query operations

Create/editor tooling MAY also mirror static values into JSON Schema `default`
annotations.

## Links

JSON Schema validates the local shape. `collection.links` declares link meaning.

```yaml
collection:
  links:
    parent:
      target_type: task
      validate_exists: true
    blocks[]:
      target_type: task
      validate_exists: false
```

`blocks[]` applies to every item in an array field named `blocks`.

Tools MUST NOT use JSON Schema custom keywords as the portable representation
for link semantics.

## Cross-File Uniqueness

`collection.unique` declares collection-level uniqueness.

```yaml
collection:
  unique:
    - field: id
      scope: type
```

Scopes:

| Scope | Meaning |
| --- | --- |
| `collection` | unique across all records in the collection |
| `type` | unique across records matching the same type |
| `path_glob` | unique within a configured path glob |

Missing and null values are exempt unless a future extension declares otherwise.

## Path Policy

Path policy guides create and rename operations.

```yaml
collection:
  path:
    pattern: "tasks/{id}.md"
```

Simple patterns may interpolate frontmatter fields and file metadata. A tool
MUST reject a generated path that escapes the collection root.

The portable path grammar uses `{field}` placeholders only. Placeholder names
MUST be top-level frontmatter fields, and values are converted to strings
without expression evaluation. Missing or null placeholders are
`path_value_missing` errors. `/`, `\\`, `.` and `..` path components produced by
placeholder values MUST be rejected rather than sanitized. Domain template
languages belong under an `x-*` section or a runtime-owned path policy.

Complex path behavior belongs in lifecycle or domain runtime policy.

## Display Metadata

Display metadata is non-normative unless a profile explicitly depends on it.

```yaml
collection:
  display:
    name_field: title
    description_field: summary
    icon: check-circle
    color_field: status
```

This metadata is useful for editors, Bases-like views, and generated docs, but
it does not affect validation.

## Projections

v0.3 core does not require type-local computed fields.

If a tool supports collection projections, they SHOULD be declared outside JSON
Schema and use CEL:

```yaml
collection:
  projections:
    is_overdue:
      expr: 'present.record.due && due < today() && status != "done"'
```

Projection values are effective query values. They are not persisted unless a
runtime workflow or operation explicitly writes them.

## Domain Namespaces

Domain-specific annotations SHOULD live in namespaced sections:

```yaml
x-tasknotes:
  fields:
    status:
      role: status
      completed_values: [done, cancelled]
```

This keeps JSON Schema reusable and prevents mdbase core from accumulating
application-specific field keywords.
