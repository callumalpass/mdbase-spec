# Annotated Example Collection

This is a runnable collection you can point your implementation at for manual verification.

## Layout

- `mdbase.yaml`: collection config
- `_types/`: type definitions
- `projects/`, `tasks/`, `notes/`: content files

## Quick Manual Checks

1. Load config:

```json
{ "operation": "load_config", "input": {} }
```

Expected: `valid: true`, `spec_version: "0.2.1"`.

2. Load types:

```json
{ "operation": "load_types", "input": {} }
```

Expected: `task` and `project` are available.

3. Read a valid task:

```json
{ "operation": "read", "input": { "path": "tasks/task-001.md" } }
```

Expected effective frontmatter includes:
- `status: open` (default)
- `priority: 2`

4. Validate an invalid task:

```json
{ "operation": "validate", "input": { "path": "tasks/task-002-invalid.md" } }
```

Expected:
- `valid: false`
- includes `missing_required` for `title`

5. Query tasks:

```json
{
  "operation": "query",
  "input": {
    "types": ["task"],
    "order_by": [{ "field": "file.path", "direction": "asc" }]
  }
}
```

Expected:
- both task files appear
- deterministic ordering by `file.path`

## Why This Example Exists

Appendix A has inline snippets. This folder is a complete, runnable fixture with realistic files and comments so you can debug behavior by hand before or alongside conformance tests.
