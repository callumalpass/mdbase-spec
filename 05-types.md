# 5. Types

This section defines how types (schemas) are created, structured, and interpreted. In this specification, **types are markdown files**—they live in a designated folder, have frontmatter that defines the schema, and body content that provides documentation.

---

## 5.1 Types as Markdown Files

A type is defined by a markdown file in the types folder (default: `_types/`). The file's frontmatter contains the schema definition; the body contains documentation for the type.

**Example: `_types/task.md`**

```markdown
---
name: task
description: A task or todo item with status tracking
extends: base
strict: false

fields:
  title:
    type: string
    required: true
    description: Short summary of the task
  status:
    type: enum
    values: [open, in_progress, blocked, done]
    default: open
  priority:
    type: integer
    min: 1
    max: 5
    default: 3
  due_date:
    type: date
  tags:
    type: list
    items:
      type: string
    default: []
  assignee:
    type: link
    target: person
---

# Task

A task represents a discrete unit of work that can be tracked through its lifecycle.

## Status Values

- **open**: Not yet started
- **in_progress**: Currently being worked on
- **blocked**: Cannot proceed due to external dependency
- **done**: Completed

## Usage

Tasks are typically stored in the `tasks/` folder. Example:

```yaml
---
type: task
title: Fix the login bug
status: in_progress
priority: 4
due_date: 2024-03-15
assignee: "[[alice]]"
tags: [bug, auth]
---

The login form throws an error when...
```

## Related Types

- [person](./person.md) - For assignees
- [project](./project.md) - Tasks can belong to projects
```

This approach has several benefits:

1. **Documentation lives with the schema**: The markdown body explains how to use the type
2. **Version control friendly**: Types are tracked like any other content
3. **Human readable**: Anyone can understand the type by reading the file
4. **Editable anywhere**: No special tooling required to modify schemas
5. **Meta-consistency**: Types use the same format as the content they describe

---

## 5.2 Type Definition Schema

The frontmatter of a type file MUST conform to this structure:

```yaml
# =============================================================================
# REQUIRED
# =============================================================================

# The type name (must match filename without extension)
name: task

# =============================================================================
# OPTIONAL: Metadata
# =============================================================================

# Human-readable description
description: "A task or todo item"

# Type to inherit fields from
extends: base

# Strictness mode (overrides settings.default_strict)
# false: Allow unknown fields
# true: Reject unknown fields
# "warn": Allow but warn about unknown fields
strict: false

# =============================================================================
# OPTIONAL: Matching Rules
# =============================================================================

# Rules for automatically associating files with this type
# If not specified, files must explicitly declare their type
match:
  path_glob: "tasks/**/*.md"
  fields_present: [status]
  where:
    # Field predicates using expression operators
    tags:
      contains: "task"

# =============================================================================
# OPTIONAL: Filename Pattern
# =============================================================================

# Pattern for validating/generating filenames
# Variables in {} reference field values
filename_pattern: "{id}.md"

# =============================================================================
# REQUIRED (unless extends provides all fields)
# =============================================================================

# Field definitions
fields:
  field_name:
    type: string
    required: false
    # ... field options
```

---

## 5.3 The `name` Field

Every type MUST have a `name` field that matches the filename (without extension).

```
_types/task.md    →  name: task
_types/person.md  →  name: person
```

If the name doesn't match the filename, implementations MUST emit a warning and use the `name` value as the canonical type name.

Names MUST:
- Consist of lowercase letters, numbers, hyphens, and underscores
- Start with a letter
- Not exceed 64 characters

Type names are canonicalized to lowercase. Implementations SHOULD treat
type names case-insensitively when reading frontmatter (`type`/`types`)
and SHOULD normalize them to lowercase for matching and output while
emitting a warning for non-canonical casing.

**Reserved names** (MUST NOT be used):
- Names starting with `_` (reserved for internal use)
- `file`, `formula`, `this`, `note` (reserved keywords in expressions)

---

## 5.4 Type Inheritance

Types MAY inherit from another type using the `extends` field:

```yaml
# _types/base.md
---
name: base
fields:
  id:
    type: string
    required: true
  created_at:
    type: datetime
    generated: now
  updated_at:
    type: datetime
    generated: now_on_write
---
```

```yaml
# _types/task.md
---
name: task
extends: base
fields:
  title:
    type: string
    required: true
  status:
    type: enum
    values: [open, done]
---
```

The `task` type inherits `id`, `created_at`, and `updated_at` from `base`, and adds `title` and `status`.

### Inheritance Rules

1. **Single inheritance only**: A type can extend at most one parent type
2. **Chains allowed**: `task` extends `base` extends `root` is valid
3. **Field override**: Child fields with the same name override parent fields completely
4. **Circular inheritance**: MUST be detected and rejected with an error
5. **Missing parent**: If the parent type doesn't exist, validation MUST fail
6. **Strictness**: Child inherits parent's `strict` unless explicitly overridden

### Field Override Example

```yaml
# Parent defines priority as 1-3
# _types/base-task.md
fields:
  priority:
    type: integer
    min: 1
    max: 3

# Child redefines priority as 1-5
# _types/task.md
extends: base-task
fields:
  priority:
    type: integer
    min: 1
    max: 5  # Now allows 4 and 5
```

The child completely replaces the parent's field definition; constraints are not merged.

---

## 5.5 Strictness

The `strict` field controls how unknown fields are handled during validation:

| Value | Behavior |
|-------|----------|
| `false` | Unknown fields are allowed without warning |
| `"warn"` | Unknown fields are allowed but trigger warnings |
| `true` | Unknown fields cause validation failure |

**Default:** Inherits from `settings.default_strict` in the config (which defaults to `false`).

"Unknown fields" are fields in a file's frontmatter that are not defined in the type's schema (including inherited fields).

---

## 5.6 Filename Patterns

The optional `filename_pattern` defines expected filename structure:

```yaml
filename_pattern: "{id}-{slug}.md"
```

Patterns use `{}` to reference field values. Common placeholders:
- `{id}`: The id field value
- `{slug}`: A URL-safe slug (implementations should slugify automatically)
- `{date}`: A date field formatted as YYYY-MM-DD

**Use cases:**

1. **Validation**: Check that existing filenames match the pattern
2. **Generation**: When creating new files, derive filename from field values

**Slugification rules:**
- Lowercase all characters
- Replace spaces and special characters with hyphens
- Remove consecutive hyphens
- Trim hyphens from start and end
- **Unicode handling:** Implementations MUST use Unicode-aware lowercasing (not locale-dependent). Non-ASCII letters SHOULD be transliterated to their ASCII equivalents where a well-known mapping exists (e.g., `ü` → `u`, `ñ` → `n`). Characters with no ASCII equivalent SHOULD be removed rather than replaced with hyphens.

---

## 5.7 Type Loading Order

When loading types from the types folder:

1. Scan all `.md` files in the types folder (including subdirectories)
2. Parse each file's frontmatter
3. Build a dependency graph based on `extends` relationships
4. Detect and reject circular dependencies
5. Load types in dependency order (parents before children)
6. Merge inherited fields into each type's effective schema

---

## 5.8 Built-in vs User Types

This specification does not define built-in types. All types are user-defined via markdown files.

However, implementations MAY provide **starter templates** for common types (task, note, person, etc.) that users can copy into their types folder and customize.

---

## 5.9 Creating Type Files Programmatically

Implementations MUST provide a way to create type definition files. This is a normal write operation that:

1. Validates the type definition schema
2. Checks for name conflicts with existing types
3. Writes the file to the types folder
4. Reloads the types registry

**Example CLI interaction:**

```bash
# Create a new type interactively
mdbase type create

# Create with a template
mdbase type create --from-template task

# Scaffold from an existing file's frontmatter
mdbase type create --infer-from notes/example.md
```

---

## 5.10 Type Documentation (Body Content)

The body of a type file is documentation. It has no semantic effect on the schema but SHOULD explain:

- The purpose of the type
- How to use each field
- Example files
- Relationships with other types
- Best practices

Implementations MAY render this documentation in tooling (e.g., showing field help, type browser).

---

## 5.11 Schema Evolution

When a type definition changes, existing files are NOT automatically migrated — files are the source of truth. The following rules define what happens for each kind of schema change:

**Field added (optional):** Existing files without the field remain valid. The field is `undefined` (not `null`) until explicitly set. If a `default` is specified in the type definition, it applies at read time.

**Field added (required):** Existing files without the field fail validation. Implementations MUST report `missing_required` errors. Users must add the field to affected files manually or via batch update.

**Field removed:** Existing files with the removed field are treated as having an unknown field. Behavior depends on the type's `strict` setting (see [§5.5](#55-strictness)). No data is deleted from files.

**Field type changed:** Existing files with values of the old type fail validation with `type_mismatch`. No automatic coercion of persisted data is performed.

**Field renamed:** The specification does not track field renames — this is equivalent to removing one field and adding another. Implementations MAY provide a batch rename tool as a convenience.

**Type renamed:** Existing files with `type: old_name` fail type matching. Implementations MUST provide a batch update command to update type declarations across files.

**Inheritance changed:** The effective schema is recomputed. Fields gained from a new parent apply the same rules as "field added." Fields lost apply the same rules as "field removed."

**Migration strategy:** Validation is the migration mechanism. Run validation on the collection after schema changes, review reported errors, and fix affected files.

---

## 5.12 Computed Fields

Type definitions MAY include fields with a `computed` property containing an expression:

```yaml
fields:
  full_name:
    type: string
    computed: "first_name + ' ' + last_name"
  overdue:
    type: boolean
    computed: "due_date < today() && status != 'done'"
```

### Rules

- Computed fields are evaluated at read time and are NOT persisted to the file
- They are available in queries, formulas, and expressions like any other field
- Computed fields MUST NOT be `required` (they are always derived)
- Computed fields MUST NOT have `default` or `generated` — these are mutually exclusive mechanisms
- If a file contains a frontmatter key matching a computed field name, the persisted value is ignored and the computed value takes precedence. Implementations SHOULD emit a warning

### Evaluation Order

Non-computed fields are resolved first, then computed fields in dependency order. Computed fields MAY reference other computed fields, which are resolved via dependency ordering.

Circular computed field dependencies MUST be detected and rejected with a `circular_computed` error.

### Inheritance

Computed fields from parent types are inherited and MAY be overridden by child types.

### Example

```yaml
# _types/task.md
---
name: task
fields:
  first_name:
    type: string
  last_name:
    type: string
  full_name:
    type: string
    computed: "first_name + ' ' + last_name"
  due_date:
    type: date
  status:
    type: enum
    values: [open, in_progress, done]
  is_overdue:
    type: boolean
    computed: "due_date < today() && status != 'done'"
---
```

---

## 5.13 Complete Type File Example

```markdown
---
name: meeting-note
description: Notes from a meeting
extends: base

strict: "warn"

match:
  path_glob: "meetings/**/*.md"
  fields_present: [date, attendees]

filename_pattern: "{date}-{title}.md"

fields:
  title:
    type: string
    required: true
    description: Meeting title or topic
  
  date:
    type: date
    required: true
    description: Date the meeting occurred
  
  attendees:
    type: list
    items:
      type: link
      target: person
    min_items: 1
    description: People who attended
  
  agenda:
    type: list
    items:
      type: string
    default: []
    description: Planned discussion topics
  
  decisions:
    type: list
    items:
      type: object
      fields:
        topic:
          type: string
          required: true
        decision:
          type: string
          required: true
        owner:
          type: link
          target: person
    default: []
    description: Decisions made during the meeting
  
  action_items:
    type: list
    items:
      type: link
      target: task
    default: []
    description: Tasks created from this meeting
  
  next_meeting:
    type: date
    description: Scheduled follow-up date
---

# Meeting Note

Meeting notes capture discussions, decisions, and action items from team meetings.

## Required Fields

- **title**: A short, descriptive title (e.g., "Q1 Planning", "Design Review")
- **date**: When the meeting occurred (YYYY-MM-DD format)
- **attendees**: At least one person must be linked

## Decisions Format

Decisions are structured objects with:
- `topic`: What was being decided
- `decision`: The outcome
- `owner`: Who is responsible for follow-through

```yaml
decisions:
  - topic: API versioning strategy
    decision: Use URL path versioning (/v1/, /v2/)
    owner: "[[alice]]"
```

## Linking to Tasks

Action items should be created as separate task files and linked:

```yaml
action_items:
  - "[[tasks/update-api-docs]]"
  - "[[tasks/create-v2-endpoints]]"
```

## Example

```yaml
---
type: meeting-note
title: Sprint Planning
date: 2024-03-01
attendees:
  - "[[alice]]"
  - "[[bob]]"
  - "[[charlie]]"
agenda:
  - Review last sprint
  - Estimate new stories
  - Assign work
decisions:
  - topic: Sprint length
    decision: Keep 2-week sprints
    owner: "[[alice]]"
action_items:
  - "[[tasks/story-123]]"
next_meeting: 2024-03-15
---

## Discussion

Sprint velocity was 42 points last sprint...
```
```
