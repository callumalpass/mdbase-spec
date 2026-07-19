# Reference Test Runner

The repository includes a reference conformance runner at `scripts/mdbase-test.py`.

## Purpose

This runner gives all implementors one shared interpretation of the YAML test format in `14-conformance.md` §14.3 and §14.3.1.

## Usage

```bash
# list tests
python scripts/mdbase-test.py list
python scripts/mdbase-test.py list --level 1

# run tests
python scripts/mdbase-test.py run --impl ./my-adapter
python scripts/mdbase-test.py run --impl ./my-adapter --level 1
python scripts/mdbase-test.py run --impl ./my-adapter --category validation
python scripts/mdbase-test.py run --impl ./my-adapter --file tests/level-1/config.yaml
```

## Adapter Interface

Your adapter is a subprocess that handles one request per invocation.

Input (stdin, JSON):

```json
{
  "collection": "/abs/path/to/collection",
  "operation": "read",
  "input": { "path": "tasks/task-001.md" },
  "simulate": {
    "external_modify": {
      "path": "tasks/task-001.md",
      "content": "---\ntitle: changed\n---\n"
    }
  }
}
```

Output (stdout, JSON success):

```json
{
  "valid": true,
  "path": "tasks/task-001.md",
  "frontmatter": {
    "title": "Task"
  }
}
```

Output (stdout, JSON operation error):

```json
{
  "valid": false,
  "error": {
    "code": "file_not_found",
    "message": "tasks/task-001.md not found"
  }
}
```

Rules:
- Always print valid JSON.
- Exit code `0` for both success and expected operation errors.
- Non-zero exit code is treated as adapter/runtime failure.

## Supported Assertions

The runner currently checks:
- `valid`, `error.code`, `path`
- `frontmatter`, `config`, `issues`, `warnings`
- `results`, `meta`, `body_contains`
- `batch_result`
- `frontmatter_written`, `frontmatter_not_written`, `frontmatter_not_bare_null`, `frontmatter_changed`
- `message_present`, `mtime_present`, `ctime_present`, `size_positive`
- `verify_after` follow-up operation

## Supported Setup Features

Setup fixture fields:
- `config`
- `types`
- `files`
- `encoding` (e.g. `latin-1`)
- `line_endings` (`LF` or `CRLF`)

Each test runs in a fresh temp collection.

## Common Implementation Pattern

1. Build your library/API normally.
2. Add a thin adapter executable:
   - parse JSON stdin
   - dispatch `operation`
   - normalize your result into runner response shape
3. Run `mdbase-test.py` in CI.

Minimal Python adapter skeleton:

```python
#!/usr/bin/env python3
import json, sys

req = json.loads(sys.stdin.read())
op = req.get("operation")
inp = req.get("input", {})

try:
    # dispatch to your implementation here
    out = {"valid": False, "error": {"code": "invalid_request", "message": f"unsupported op: {op}"}}
except Exception as exc:
    out = {"valid": False, "error": {"code": "invalid_request", "message": str(exc)}}

print(json.dumps(out))
sys.exit(0)
```

Working template file:
- `examples/adapter-template.py`

## Notes

- The runner is intentionally strict on schema shape but lenient on extra response fields.
- For debugging, run a single test file first, then a full level.
