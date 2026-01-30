# 12. Operations

This section defines the behavior of Create, Read, Update, Delete, and Rename operations on collection files.

---

## 12.1 Create

Creates a new file in the collection.

### Input

| Parameter | Required | Description |
|-----------|----------|-------------|
| `type` | No | Type name(s) for the file |
| `frontmatter` | Yes | Field values (may be partial) |
| `body` | No | Markdown body content |
| `path` | No | Target file path (may be derived) |

### Behavior

1. **Determine type(s)**: Use provided type, or infer from frontmatter if `type`/`types` key present

2. **Apply defaults**: For each missing field with a `default` value, apply the default

3. **Generate values**: For fields with `generated` strategy:
   - `ulid`: Generate ULID
   - `uuid`: Generate UUID v4
   - `now`: Set to current datetime
   - `{from, transform}`: Derive from source field

4. **Validate**: If validation level is not `off`:
   - Validate against all matched type schemas
   - If level is `error` and validation fails, abort

5. **Determine path**:
   - If `path` provided, use it
   - If type has `filename_pattern`, derive from field values
   - Otherwise, require explicit path

6. **Check existence**: If file already exists at path, abort with error

7. **Write file**: 
   - Serialize frontmatter to YAML
   - Combine with body
   - Write atomically (temp file + rename)

### Output

```yaml
path: "tasks/task-001.md"
frontmatter:
  id: "01ARZ3NDEKTSV4RRFFQ69G5FAV"
  title: "Fix the bug"
  status: open
  created_at: "2024-03-15T10:30:00Z"
  # ... all fields including generated
```

### Errors

| Code | Description |
|------|-------------|
| `unknown_type` | Specified type doesn't exist |
| `validation_failed` | Validation errors (with details) |
| `path_conflict` | File already exists at target path |
| `path_required` | Cannot determine path |

### Example

```bash
mdbase create task \
  --field title="Fix login bug" \
  --field priority=4 \
  --field "assignee=[[alice]]"
```

---

## 12.2 Read

Reads a file and returns its parsed content.

### Input

| Parameter | Required | Description |
|-----------|----------|-------------|
| `path` | Yes | File path relative to collection root |
| `validate` | No | Whether to validate (default: per settings) |
| `include_body` | No | Include body content (default: true) |

### Behavior

1. **Load file**: Read from filesystem

2. **Parse frontmatter**: Extract YAML frontmatter and body

3. **Determine types**: 
   - Check for explicit `type`/`types` field
   - Evaluate match rules for all types
   - Collect matched types

4. **Validate** (if enabled):
   - Validate against all matched types
   - Collect validation issues

5. **Return record**: Structured representation

### Output

```yaml
path: "tasks/task-001.md"
types: [task]
frontmatter:
  id: "task-001"
  title: "Fix the bug"
  status: open
  # ... all fields
file:
  name: "task-001.md"
  folder: "tasks"
  mtime: "2024-03-15T10:30:00Z"
  size: 1234
body: "## Description\n\nThe login form..."
validation:
  valid: true
  issues: []
```

### Errors

| Code | Description |
|------|-------------|
| `file_not_found` | File doesn't exist |
| `invalid_frontmatter` | YAML parse error |

---

## 12.3 Update

Modifies an existing file's frontmatter and/or body.

### Input

| Parameter | Required | Description |
|-----------|----------|-------------|
| `path` | Yes | File path |
| `fields` | No | Field updates (partial) |
| `body` | No | New body content (null = no change) |

### Behavior

1. **Read existing file**: Load current content

2. **Merge fields**: Apply field updates to existing frontmatter
   - New fields are added
   - Existing fields are replaced
   - Explicit null removes the field (if `write_nulls: omit`) or writes null

3. **Update generated fields**: For fields with `generated: now_on_write`, update to current time

4. **Validate**: If enabled, validate merged frontmatter

5. **Write file**:
   - Preserve field order where possible
   - Preserve body if not provided
   - Write atomically

### Null Handling on Update

When updating a field to null:

| `write_nulls` setting | Behavior |
|-----------------------|----------|
| `"omit"` (default) | Remove the field from frontmatter |
| `"explicit"` | Write `field: null` |

**Important**: Never write the empty-value form `field:` (see [Frontmatter](./03-frontmatter.md)).

### Output

```yaml
path: "tasks/task-001.md"
frontmatter:
  # ... updated frontmatter
previous:
  status: open
updated:
  status: done
```

### Errors

| Code | Description |
|------|-------------|
| `file_not_found` | File doesn't exist |
| `validation_failed` | Validation errors |

### Example

```bash
# Update single field
mdbase update tasks/task-001.md --field status=done

# Update multiple fields
mdbase update tasks/task-001.md \
  --field status=done \
  --field "completed_at=$(date -Iseconds)"

# Clear a field
mdbase update tasks/task-001.md --field assignee=null
```

---

## 12.4 Delete

Removes a file from the collection.

### Input

| Parameter | Required | Description |
|-----------|----------|-------------|
| `path` | Yes | File path |
| `check_backlinks` | No | Warn about incoming links (default: true) |

### Behavior

1. **Check existence**: Verify file exists

2. **Check backlinks** (if enabled):
   - Find files that link to this file
   - Warn user about potential broken links

3. **Delete file**: Remove from filesystem

### Output

```yaml
path: "tasks/task-001.md"
deleted: true
broken_links:
  - path: "tasks/parent.md"
    field: "subtasks"
```

### Errors

| Code | Description |
|------|-------------|
| `file_not_found` | File doesn't exist |

### Example

```bash
# Delete with confirmation
mdbase delete tasks/task-001.md

# Delete without backlink check
mdbase delete tasks/task-001.md --no-check-backlinks

# Force delete
mdbase delete tasks/task-001.md --force
```

---

## 12.5 Rename (and Move)

Renames or moves a file, optionally updating references across the collection.

### Input

| Parameter | Required | Description |
|-----------|----------|-------------|
| `from` | Yes | Current file path |
| `to` | Yes | New file path |
| `update_refs` | No | Update references (default: per settings) |

### Behavior

1. **Validate paths**: Ensure source exists and target doesn't

2. **Rename file**: Move file to new path atomically

3. **Update references** (if `rename_update_refs` is true):

   **Frontmatter links**: Update link fields in all files that reference the renamed file
   
   ```yaml
   # Before: links to tasks/old-name.md
   parent: "[[old-name]]"
   
   # After: file renamed to tasks/new-name.md
   parent: "[[new-name]]"
   ```

   **Body links**: Update link syntax in markdown body content
   
   ```markdown
   <!-- Before -->
   See [[old-name]] for details.
   Check [the task](./old-name.md).
   
   <!-- After -->
   See [[new-name]] for details.
   Check [the task](./new-name.md).
   ```

### Reference Update Rules

1. **Preserve link style**: 
   - Wikilinks stay as wikilinks
   - Markdown links stay as markdown links
   - Relative links stay relative when possible

2. **Update all matching references**:
   - By resolved path (most reliable)
   - By name when unambiguous

3. **ID-based links**:
   - If a simple-name link (`[[name]]`) resolves via `id_field` and the target file's
     `id_field` value did not change, implementations SHOULD NOT rewrite the link
     during rename (to avoid unnecessary churn).

4. **Handle ambiguity**:
   - If a link could refer to multiple files, don't update
   - Emit warning for manual review

5. **Scope**: Update references in ALL collection files, not just same folder

### Output

```yaml
from: "tasks/old-name.md"
to: "tasks/new-name.md"
references_updated:
  - path: "tasks/parent.md"
    field: "subtasks[0]"
    old_value: "[[old-name]]"
    new_value: "[[new-name]]"
  - path: "notes/meeting.md"
    location: "body"
    old_value: "[[old-name]]"
    new_value: "[[new-name]]"
warnings:
  - path: "archive/legacy.md"
    message: "Ambiguous link '[[name]]' not updated"
```

### Errors

| Code | Description |
|------|-------------|
| `file_not_found` | Source file doesn't exist |
| `path_conflict` | Target path already exists |

### Example

```bash
# Simple rename
mdbase rename tasks/old.md tasks/new.md

# Move to different folder
mdbase rename tasks/task.md archive/task.md

# Rename without updating references
mdbase rename tasks/old.md tasks/new.md --no-update-refs

# Dry run (show what would change)
mdbase rename tasks/old.md tasks/new.md --dry-run
```

---

## 12.6 Atomicity

All write operations (Create, Update, Delete, Rename) SHOULD be atomic:

1. **Create/Update**: Write to temporary file, then rename
2. **Delete**: Single filesystem delete
3. **Rename**: Filesystem rename (atomic on most systems)

For Rename with reference updates, atomicity across multiple files is not guaranteed. Implementations SHOULD:
- Complete the rename first
- Update references file by file
- Report partial failures clearly

---

## 12.7 Batch Operations

Implementations MAY support batch operations for efficiency:

```bash
# Bulk update
mdbase update --where 'status == "open"' --field status=in_progress

# Bulk delete
mdbase delete --where 'tags.contains("archive")' --confirm

# Bulk move
mdbase move 'tasks/*.md' archive/
```

Batch operations SHOULD:
- Validate all changes before applying any
- Report per-file success/failure
- Support dry-run mode

---

## 12.8 Formatting Preservation

When writing files, implementations SHOULD preserve:

### MUST Preserve
- Body content (unless explicitly changed)
- Line ending style (LF vs CRLF)

### SHOULD Preserve
- Frontmatter field order
- String quoting style
- Multi-line string format (literal vs folded)
- Comments (if YAML parser supports it)

### MAY Normalize
- Indentation (recommend 2 spaces)
- Trailing whitespace
- Final newline (files SHOULD end with newline)

---

## 12.9 Hooks (Optional)

Implementations MAY support hooks for custom logic:

| Hook | When |
|------|------|
| `beforeCreate` | Before validation and write |
| `afterCreate` | After successful write |
| `beforeUpdate` | Before validation and write |
| `afterUpdate` | After successful write |
| `beforeDelete` | Before deletion |
| `afterDelete` | After successful deletion |
| `beforeRename` | Before rename |
| `afterRename` | After successful rename and ref updates |

Hooks receive operation context and can:
- Modify values (before hooks)
- Perform side effects (after hooks)
- Abort operation (before hooks, by throwing)

This is an OPTIONAL feature; implementations need not support hooks.
