# 9. Validation

Validation ensures that files conform to their type schemas. This section defines what is validated, when validation occurs, and how errors are reported.

---

## 9.1 Validation Levels

Implementations MUST support three validation levels:

| Level | Behavior |
|-------|----------|
| `off` | No validation performed |
| `warn` | Validation runs; issues are reported but operations succeed |
| `error` | Validation runs; issues cause operations to fail |

The default level is configured via `settings.default_validation` (default: `"warn"`).

Operations MAY override the default level:

```bash
# Force error-level validation
mdbase validate --level error

# Create with no validation
mdbase create --no-validate
```

---

## 9.2 What Is Validated

For each typed file, validation checks the following:

### 9.2.1 Required Fields

Fields marked `required: true` MUST be:
1. Present in the **effective** frontmatter (defaults applied; computed fields excluded)
2. Non-null (value is not `null`)

**Note:** `exists(field)` checks for a present key in **raw persisted** frontmatter even if its value is `null`. Required fields must be present in the effective frontmatter and non-null.

```yaml
# Type definition
fields:
  title:
    type: string
    required: true

# Valid
title: "My Document"

# Invalid: missing
# (no title key)

# Invalid: null
title: null
title:
```

### 9.2.2 Type Correctness

Values MUST match their declared type (or be coercible):

```yaml
# Type definition
fields:
  priority:
    type: integer

# Valid
priority: 5
priority: "5"  # Coerced to integer

# Invalid
priority: "high"
priority: 5.5
```

### 9.2.3 Field Constraints

Type-specific constraints MUST be satisfied:

| Type | Constraints |
|------|-------------|
| `string` | `min_length`, `max_length`, `pattern` |
| `integer`, `number` | `min`, `max` |
| `list` | `min_items`, `max_items`, `unique` |
| `enum` | `values` |
| `link` | `validate_exists` |

### 9.2.4 Unknown Fields (Strictness)

When a type has `strict: true`, unknown fields cause validation failure:

```yaml
# Type definition: strict: true
fields:
  title:
    type: string

# Valid
title: "Doc"

# Invalid: unknown field
title: "Doc"
extra_field: "not allowed"
```

With `strict: "warn"`, unknown fields trigger warnings but pass validation.

**Implicit fields:** The following frontmatter keys are always implicitly allowed, even in strict mode:

- `type` / `types` — type declaration keys (configurable via `settings.explicit_type_keys`)
- Any keys listed in `settings.explicit_type_keys`

These keys are structural and do not need to be declared in the type's `fields` definition.

### 9.2.5 Multi-Type Validation

When a file matches multiple types, it MUST validate against ALL of them:

```yaml
# File matches both 'task' and 'urgent' types
# Must satisfy:
# - All required fields from 'task'
# - All constraints from 'task'
# - All required fields from 'urgent'
# - All constraints from 'urgent'
```

### 9.2.6 Link Existence

For link fields with `validate_exists: true`, the target file MUST exist:

```yaml
# Type definition
fields:
  parent:
    type: link
    validate_exists: true

# Valid (if file exists)
parent: "[[existing-task]]"

# Invalid (file doesn't exist)
parent: "[[nonexistent]]"
```

### 9.2.7 Filename Patterns

If a type defines `filename_pattern`, filenames MAY be validated:

```yaml
# Type definition
filename_pattern: "{id}.md"

# File: task-001.md with id: "task-001" → valid
# File: random-name.md with id: "task-001" → warning (mismatch)
```

Filename pattern validation is RECOMMENDED but not strictly required.

### 9.2.8 Unique ID Field

If `settings.id_field` is configured (default: `id`), values of that field MUST be
unique across the collection. If duplicates exist, validation MUST emit a
`duplicate_id` issue for each file that shares the duplicated value.

---

## 9.3 Validation Issue Format

Each validation issue MUST include:

| Field | Type | Description |
|-------|------|-------------|
| `path` | string | File path relative to collection root |
| `field` | string | Field path (e.g., `author.email`, `tags[0]`) |
| `code` | string | Error code (see [Appendix C](./appendix-c-error-codes.md)) |
| `message` | string | Human-readable error description |
| `severity` | enum | `error` or `warning` |

**Optional fields:**

| Field | Type | Description |
|-------|------|-------------|
| `expected` | any | Expected value or type |
| `actual` | any | Actual value found |
| `type` | string | Type name that triggered the issue |
| `line` | integer | 1-based line number in the source file |
| `column` | integer | 1-based column number |
| `end_line` | integer | End line of the issue range |
| `end_column` | integer | End column of the issue range |

Implementations SHOULD include `line` and `column` fields when source position information is available. These fields enable LSP-style diagnostics and precise issue reporting in CI tooling.

### Example Issue

```json
{
  "path": "tasks/fix-bug.md",
  "field": "priority",
  "code": "constraint_violation",
  "message": "Value 7 exceeds maximum of 5",
  "severity": "error",
  "expected": { "max": 5 },
  "actual": 7,
  "type": "task",
  "line": 5,
  "column": 11,
  "end_line": 5,
  "end_column": 12
}
```

---

## 9.4 Validation Timing

Implementations MAY validate at different times:

| When | Description |
|------|-------------|
| On read | Validate when loading a file |
| On write | Validate before creating or updating |
| On demand | Validate via explicit command |
| Continuous | Watch mode; validate on file changes |

The specification does not mandate when validation occurs, only the behavior when it does.

### Recommended Behavior

- **Create/Update operations**: Validate before writing; fail if `validation: error`
- **Read/Query operations**: Optionally validate; report issues but don't fail
- **Explicit validate command**: Full collection validation with detailed report

---

## 9.5 Validation Commands

Implementations SHOULD provide explicit validation commands:

```bash
# Validate entire collection
mdbase validate

# Validate specific files
mdbase validate tasks/fix-bug.md notes/meeting.md

# Validate files of a specific type
mdbase validate --type task

# Validate with specific level
mdbase validate --level error

# Output validation report as JSON
mdbase validate --format json
```

---

## 9.6 Partial Validation

For large collections, implementations MAY support partial validation:

- Validate only modified files (since last validation)
- Validate only files in specific folders
- Validate only files matching certain types

This is an optimization; full validation MUST remain available.

---

## 9.7 Validation Report Example

**Human-readable format:**

```
Validation Report
================

Errors: 3
Warnings: 5

tasks/fix-bug.md
  ERROR [missing_required] Field 'title' is required but missing
  ERROR [type_mismatch] Field 'priority': expected integer, got string "high"
  WARNING [unknown_field] Field 'custom' is not defined in type 'task'

notes/meeting.md
  ERROR [constraint_violation] Field 'attendees': minimum 1 item required, got 0
  WARNING [deprecated_field] Field 'old_field' is deprecated

tasks/subtask.md
  WARNING [link_not_found] Field 'parent': target '[[nonexistent]]' not found
```

**JSON format:**

```json
{
  "summary": {
    "files_checked": 42,
    "files_valid": 39,
    "files_invalid": 3,
    "errors": 3,
    "warnings": 5
  },
  "issues": [
    {
      "path": "tasks/fix-bug.md",
      "field": "title",
      "code": "missing_required",
      "message": "Field 'title' is required but missing",
      "severity": "error",
      "type": "task"
    }
  ]
}
```

---

## 9.8 Auto-Fix (Optional)

Implementations MAY support automatic fixing of certain issues:

| Issue | Auto-Fix |
|-------|----------|
| Missing field with default | Apply default value |
| Type coercion possible | Coerce value |
| Missing generated field | Generate value |

Auto-fix MUST NOT:
- Delete user data
- Make changes that could lose information
- Fix issues where the correct resolution is ambiguous

```bash
# Preview fixes
mdbase validate --fix --dry-run

# Apply fixes
mdbase validate --fix
```

---

## 9.9 Validation in Multi-Type Context

When a file matches multiple types, validation follows these rules:

1. **All types validated**: The file must pass validation for ALL matched types
2. **Issues attributed**: Each issue includes which type triggered it
3. **Conflict detection**: If types have incompatible field definitions, report as error

**Example conflict:**

```yaml
# Type 'a' defines: status as string
# Type 'b' defines: status as enum [open, closed]

# File matches both types
# File has: status: "pending"

# Result:
# - Passes type 'a' validation (valid string)
# - Fails type 'b' validation ("pending" not in enum)
# - Overall: FAIL (must pass all types)
```

---

## 9.10 Skipping Validation

Certain scenarios may warrant skipping validation:

- **Migration**: Importing data that doesn't yet conform
- **Bulk operations**: Performance-critical batch updates
- **Emergency fixes**: Bypassing validation to fix broken state

Implementations SHOULD support:

```bash
# Skip validation on create
mdbase create --no-validate task.md

# Skip validation on update
mdbase update --no-validate task.md
```

Skipping validation SHOULD be logged for audit purposes.
