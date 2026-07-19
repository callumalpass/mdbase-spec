# Implementing mdbase-spec: Level 1 Quickstart

This guide is the shortest path from zero to passing Level 1 conformance tests.

Scope:
- Target: Level 1 (Core)
- Spec version: `0.2.1`
- Test suite: `tests/level-1/*.yaml`

## 1. What "Conformance" Means

In practice, conformance means:
- You implement the behavior defined by the spec sections referenced by tests.
- You run the conformance suite against your adapter.
- You pass all tests for the claimed level (and all lower levels).

For Level 1, that is primarily:
- config parsing
- frontmatter parsing and serialization
- type loading and basic type creation
- validation
- core operations + concurrency checks

Reference: `14-conformance.md`.

## 2. What Your Implementation Must Expose

Your implementation can be a library, binary, daemon, or CLI. For the test suite, you expose a small adapter process that:
- reads one JSON object from stdin
- executes one operation
- writes one JSON object to stdout
- exits with code `0` for both success and expected operation errors

Request shape:

```json
{
  "collection": "/abs/path/to/temp/collection",
  "operation": "read",
  "input": { "path": "tasks/t1.md" },
  "simulate": { "external_modify": { "path": "tasks/t1.md", "content": "..." } }
}
```

Response shape (success):

```json
{
  "valid": true,
  "path": "tasks/t1.md",
  "frontmatter": { "title": "Task 1" }
}
```

Response shape (operation error):

```json
{
  "valid": false,
  "error": { "code": "file_not_found", "message": "..." }
}
```

Important:
- Expected operation errors belong in JSON output (`error.code`), not process exit code.
- Non-zero exit code is treated as adapter failure by the runner.

Reference: `REFERENCE-RUNNER.md`, `scripts/mdbase-test.py`.

## 3. Operations You Need for Level 1 (Current Suite)

The Level 1 suite currently uses these operations:
- `load_config`
- `load_types`
- `get_type`
- `create_type`
- `read`
- `create`
- `update`
- `delete`
- `rename`
- `validate`
- `query` (minimal subset; see `14-conformance.md` §14.3.1)
- `evaluate` (standalone expression checks used by Level 1 tests)
- `batch_update`
- `init`

You can return `invalid_request` for malformed input.

## 4. How to Read Test YAML

The test format is defined in `14-conformance.md` §14.3.

Top-level keys:
- `name`, `level`, `category`, `spec_ref`
- `setup` (optional)
- `groups` (preferred structure)

Each group has:
- `setup`: collection fixture (`config`, `types`, `files`)
- `tests`: list of test cases

Each test has:
- `operation`
- `input`
- `expect`
- optional per-test `setup` override

Test runner behavior:
- builds a fresh temp collection per test
- merges setup shallowly: file -> group -> test override
- calls exactly one operation for the test
- can run `verify_after` follow-up assertions

Common `expect` assertions:
- `valid`, `error.code`, `path`
- subset checks on `frontmatter`, `config`, `results`, `meta`, `issues`
- write assertions like `frontmatter_written`, `frontmatter_not_written`

## 5. Level 1 Build Order (Recommended)

1. `load_config` + collection discovery
2. frontmatter parser/writer (`null` vs empty string vs missing)
3. `load_types`/`get_type` + inheritance validation basics
4. field validators and coercion
5. `create`/`read`/`update`/`delete`/`rename`
6. `validate` operation with issue format
7. minimal `query` subset for low-level tests
8. `create_type`, `batch_update`, `init`, `evaluate`
9. concurrency checks (`concurrent_modification`)

## 6. Run the Suite

```bash
# List tests
python scripts/mdbase-test.py list --level 1

# Run all Level 1 tests
python scripts/mdbase-test.py run --impl ./my-adapter --level 1

# Run a single file while iterating
python scripts/mdbase-test.py run --impl ./my-adapter --file tests/level-1/validation.yaml
```

## 7. Definition of Done for Level 1

You can claim Level 1 when:
- all `tests/level-1/*.yaml` pass under the reference runner
- your tool reports `error.code` values from `appendix-c-error-codes.md`
- behavior matches the spec references cited in failing/passing tests

Use `examples/annotated-collection/` for manual smoke checks alongside automated tests.
