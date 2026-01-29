# 6. Type Matching

This section defines how files are associated with types. Unlike traditional schemas where each record belongs to exactly one table, this specification supports **multi-type matching**: a file may match zero, one, or multiple types simultaneously.

---

## 6.1 Matching Overview

Type matching determines which types apply to a file. This happens:

- When reading a file (to know which schemas to validate against)
- When querying (to filter by type)
- When updating (to apply type-specific validation)

A file's types are determined by:

1. **Explicit declaration** (highest precedence): If the file's frontmatter contains a type key (e.g., `type: task`), only those declared types apply
2. **Match rules**: If no explicit declaration, each type's `match` rules are evaluated; all matching types apply
3. **Untyped**: If nothing matches, the file is untyped

---

## 6.2 Explicit Type Declaration

Files can explicitly declare their type(s) using frontmatter keys defined in `settings.explicit_type_keys` (default: `type` and `types`).

### Single Type

```yaml
---
type: task
title: Fix the bug
---
```

This file is a `task` and only `task`. Match rules are not evaluated.

### Multiple Types

```yaml
---
types: [task, urgent]
title: Fix critical security bug
---
```

This file is both a `task` and an `urgent` record. It must validate against both schemas.

### Precedence

If both `type` and `types` are present, implementations SHOULD prefer `types` (the plural form).

```yaml
---
type: task          # Ignored when types is present
types: [task, bug]  # This is used
---
```

---

## 6.3 Match Rules

Types can define rules for automatically associating files without explicit declaration. Match rules are specified in the type's `match` field:

```yaml
# _types/task.md
---
name: task
match:
  path_glob: "tasks/**/*.md"
  fields_present: [status, due_date]
  where:
    status:
      exists: true
    priority:
      gte: 1
---
```

All conditions in `match` are combined with **AND** logic—all must be true for the type to match.

---

## 6.4 Match Conditions

### `path_glob`

Matches files by their path relative to the collection root.

```yaml
match:
  path_glob: "tasks/**/*.md"
```

**Glob syntax:**
- `*` matches any characters except `/`
- `**` matches any characters including `/`
- `?` matches a single character

**Examples:**
| Pattern | Matches |
|---------|---------|
| `tasks/*.md` | `tasks/foo.md`, not `tasks/sub/foo.md` |
| `tasks/**/*.md` | Any `.md` in `tasks/` or subdirectories |
| `*.task.md` | `foo.task.md`, `bar.task.md` |
| `notes/2024-*.md` | `notes/2024-01.md`, `notes/2024-12.md` |

### `fields_present`

Matches files that have all specified fields present and non-null.

```yaml
match:
  fields_present: [status, assignee]
```

A field is "present" if:
- The key exists in frontmatter, AND
- The value is not `null`

### `where`

Matches files based on field value conditions. This uses a subset of the expression language operators:

```yaml
match:
  where:
    # Exact equality
    type: "task"
    
    # Field exists and is non-null
    status:
      exists: true
    
    # Comparison operators
    priority:
      gte: 3
    
    # List contains
    tags:
      contains: "important"
    
    # String prefix
    title:
      starts_with: "URGENT:"
```

**Available operators in `where`:**

| Operator | Description | Example |
|----------|-------------|---------|
| (direct value) | Exact equality | `status: open` |
| `exists` | Field is present (true) or missing (false) | `assignee: { exists: true }` |
| `eq` | Equal to | `priority: { eq: 3 }` |
| `neq` | Not equal to | `status: { neq: "done" }` |
| `gt` | Greater than | `priority: { gt: 2 }` |
| `gte` | Greater than or equal | `priority: { gte: 3 }` |
| `lt` | Less than | `priority: { lt: 4 }` |
| `lte` | Less than or equal | `priority: { lte: 5 }` |
| `contains` | List contains value | `tags: { contains: "bug" }` |
| `contains_all` | List contains all values | `tags: { contains_all: ["bug", "urgent"] }` |
| `contains_any` | List contains any value | `tags: { contains_any: ["bug", "feature"] }` |
| `starts_with` | String starts with | `title: { starts_with: "WIP:" }` |
| `ends_with` | String ends with | `file: { ends_with: ".draft.md" }` |
| `matches` | Regex match | `title: { matches: "^TASK-\\d+" }` |

---

## 6.5 Multi-Type Matching

When a file matches multiple types (whether by explicit declaration or match rules), the file must conform to **all** matched types.

### Validation

The file is validated against each type's schema. All validations must pass:

```yaml
# File: tasks/urgent-bug.md
---
types: [task, urgent]
title: Fix login
status: open
escalation_contact: alice@example.com
---
```

This file must:
- Have all required fields from `task`
- Satisfy all constraints from `task`
- Have all required fields from `urgent`
- Satisfy all constraints from `urgent`

### Field Conflicts

When two types define the same field differently:

**Compatible definitions** (same base type, constraints can merge):
```yaml
# Type A: priority as integer 1-5
# Type B: priority as integer 1-3
# Effective: priority as integer, max(1,1)-min(5,3) = 1-3 (most restrictive)
```

**Incompatible definitions** (different base types):
```yaml
# Type A: status as string
# Type B: status as enum [open, closed]
# This is a validation error - types are incompatible
```

When field types are incompatible, implementations MUST report an error. The file cannot satisfy both schemas.

### Querying

A multi-type file appears in queries for ANY of its matched types:

```yaml
# Query for tasks
query:
  types: [task]
# Returns files that are tasks (including files that are also other types)

# Query for files that are BOTH task AND urgent
query:
  where:
    and:
      - 'types.contains("task")'
      - 'types.contains("urgent")'
```

---

## 6.6 Matching Evaluation Order

1. **Check explicit declaration**: If `type` or `types` is in frontmatter, use those types exclusively. Stop.

2. **Evaluate match rules**: For each type with match rules, evaluate all conditions:
   - If all conditions pass, the type matches
   - A type without match rules never matches implicitly

3. **Collect matches**: The file's types are all types that matched in step 2.

4. **Untyped**: If no types matched, the file is untyped.

---

## 6.7 Match Rule Examples

### Path-Based Matching

```yaml
# _types/task.md
match:
  path_glob: "tasks/**/*.md"
```

All files in `tasks/` are tasks.

### Field-Based Matching

```yaml
# _types/actionable.md
match:
  fields_present: [due_date]
```

Any file with a `due_date` field is actionable.

### Tag-Based Matching

```yaml
# _types/urgent.md
match:
  where:
    tags:
      contains: "urgent"
```

Any file tagged "urgent" matches this type.

### Combined Matching

```yaml
# _types/active-task.md
match:
  path_glob: "tasks/**/*.md"
  fields_present: [status, assignee]
  where:
    status:
      neq: "done"
```

Files in `tasks/` with status and assignee fields, where status is not "done".

---

## 6.8 Type-Only Files (No Matching)

A type without `match` rules will never automatically match files. Files must explicitly declare the type:

```yaml
# _types/template.md
---
name: template
# No match rules
fields:
  template_name:
    type: string
    required: true
---
```

This type only applies to files that declare `type: template` or `types: [template, ...]`.

---

## 6.9 The `types` Property in Expressions

In expressions, files have a `types` property (list of strings) representing their matched types:

```yaml
# Filter: files that are tasks
filters: 'types.contains("task")'

# Filter: files that are both task and urgent
filters: 'types.contains("task") && types.contains("urgent")'

# Filter: files that have no type
filters: "types.length == 0"
```

---

## 6.10 Debugging Type Matching

Implementations SHOULD provide a way to see why a file matched (or didn't match) specific types. For example:

```bash
# Show matching analysis for a file
mdbase debug match tasks/fix-bug.md

# Output:
# tasks/fix-bug.md
# ├── Explicit types: none
# ├── Matched types: [task, urgent]
# │   ├── task: matched via path_glob "tasks/**/*.md"
# │   └── urgent: matched via where.tags.contains("urgent")
# └── Unmatched types:
#     └── done: failed where.status.eq("done")
```
