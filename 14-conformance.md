# 14. Conformance

This section defines conformance levels and testing requirements for implementations.

---

## 14.1 Conformance Levels

Implementations may claim conformance at different levels. Each level builds on all previous levels.

### Level 1: Core

**Required capabilities:**

- Parse `mdbase.yaml` configuration
- Locate and scan markdown files in collection
- Parse YAML frontmatter from files
- Handle null values correctly (per §3)
- Load type definitions from types folder
- Single-type matching via explicit declaration (`type` field)
- Validate fields against type schemas
- Implement Create, Read, Update, Delete operations
- Type coercion (per §7.16)

**Test coverage:** Basic parsing, validation, CRUD operations, concurrency (basic mtime conflict detection)

### Level 2: Matching

**Additional capabilities:**

- Path-based type matching (`path_glob`)
- Field presence matching (`fields_present`)
- Field value matching (`where` conditions in match rules)
- Multi-type matching (files matching multiple types)
- Multi-type validation with constraint merging (per §6.5)

**Test coverage:** Match rule evaluation, multi-type scenarios, constraint merging

### Level 3: Querying

**Additional capabilities:**

- Core query model (filter, sort, limit, offset)
- Expression evaluation (all operators in §11)
- String, list, and object methods
- Date arithmetic (including date subtraction)
- Duration parsing (`duration()`)
- Null coalescing (`??`)

**Test coverage:** Core query correctness, expression edge cases, body_search, computed_fields

### Level 4: Links

**Additional capabilities:**

- Parse all link formats (wikilink, markdown, bare path)
- Resolve links to files
- `asFile()` traversal in expressions
- `file.hasLink()` and `file.hasTag()` functions
- `file.links` property

**Test coverage:** Link parsing, resolution, traversal

### Level 5: References

**Additional capabilities:**

- Rename with reference updates
- Backlink computation (`file.backlinks`)
- Body link detection and update

**Test coverage:** Reference update correctness, backlink accuracy

### Level 6: Full

**All capabilities including:**

- Caching with staleness detection (per §13)
- Batch operations
- Watch mode with event delivery (per [§15](./15-watching.md))
- Type creation via tooling
- Nested collection detection (per §2)

**Test coverage:** Performance, cache correctness, watching, edge cases

---

## 14.1.1 Optional Profiles (Non-Normative)

Implementations MAY support optional profiles beyond the core levels. The Query+ profile adds advanced query features (`formulas`, `groupBy`, `summaries`, `property_summaries`, `properties`) as defined in [Querying §10.7](./10-querying.md). Support for Query+ is not required for conformance.

---

## 14.2 Conformance Claims

Implementations SHOULD clearly state their conformance level:

```
mdbase-tool v1.0.0
Conformance: Level 4 (Links)
Specification: 0.1.0
```

Implementations MAY implement features from higher levels while claiming a lower level, but SHOULD NOT claim a level without passing all tests for that level.

---

## 14.3 Test Suite

A conformance test suite is provided as a collection of test cases. Each test group specifies a `spec_ref` identifying the specification section(s) under test. Individual test cases MAY also include a `spec_ref` to pinpoint the exact clause being validated.

The `spec_ref` field uses section numbers (e.g., `"§7.2"`, `"§3.4, §7.2"`). When a test case omits `spec_ref`, it inherits the group-level reference.

```yaml
name: "required field validation"
level: 1
category: validation
spec_ref: "§7.2"

setup:
  config: |
    spec_version: "0.1.0"
  types:
    task.md: |
      ---
      name: task
      fields:
        title:
          type: string
          required: true
      ---
  files:
    tasks/valid.md: |
      ---
      type: task
      title: "Valid task"
      ---
    tasks/invalid.md: |
      ---
      type: task
      ---

tests:
  - name: "valid file passes validation"
    operation: validate
    input:
      path: "tasks/valid.md"
    expect:
      valid: true
      issues: []

  - name: "missing required field fails validation"
    spec_ref: "§7.2"
    operation: validate
    input:
      path: "tasks/invalid.md"
    expect:
      valid: false
      issues:
        - code: missing_required
          field: title
```

### Test Categories

| Category | Description |
|----------|-------------|
| `config` | Configuration parsing and validation |
| `types` | Type definition loading and inheritance |
| `matching` | Type matching rules |
| `validation` | Schema validation |
| `expressions` | Expression evaluation |
| `queries` | Query execution |
| `links` | Link parsing and resolution |
| `operations` | CRUD operations |
| `references` | Reference updates |
| `caching` | Cache behavior |
| `concurrency` | Concurrent modification detection |
| `watching` | Watch mode event delivery |
| `body_search` | Body content filtering |
| `computed_fields` | Computed field evaluation |

---

## 14.4 Required Test Coverage

For each conformance level, implementations MUST pass:

| Level | Required Categories |
|-------|---------------------|
| 1 | config, types (basic), validation (basic), operations, concurrency |
| 2 | + matching |
| 3 | + expressions, queries, body_search, computed_fields |
| 4 | + links |
| 5 | + references |
| 6 | + caching, watching |

---

## 14.5 Test Execution

Test suite can be run against any implementation:

```bash
# Run all tests
mdbase-test run --impl ./my-impl

# Run specific level
mdbase-test run --impl ./my-impl --level 3

# Run specific category
mdbase-test run --impl ./my-impl --category validation

# Generate conformance report
mdbase-test report --impl ./my-impl --output report.html
```

---

## 14.6 Implementation Notes

### Edge Cases to Handle

Implementations should correctly handle:

- Empty frontmatter (`---\n---`)
- File without frontmatter
- Frontmatter with only null values
- Empty collection (no files)
- Type with no fields defined
- File matching zero types
- File matching multiple conflicting types
- Circular type inheritance (should error)
- Self-referential links
- Links to non-existent files
- Very long field values
- Unicode in field names and values
- Files with unusual characters in names

### Performance Expectations

While not strictly required, implementations SHOULD:

| Operation | Target | Collection Size |
|-----------|--------|-----------------|
| Read single file | < 10ms | Any |
| Query by type | < 100ms | 1000 files |
| Query with filter | < 500ms | 1000 files |
| Link resolution | < 10ms | Any |
| Backlink query | < 1s | 1000 files (cached) |

### Error Messages

Implementations SHOULD provide helpful error messages:

```
❌ Validation failed: tasks/task-001.md

  Field 'priority' has invalid value
    Expected: integer between 1 and 5
    Actual: "high" (string)
    
  At line 5 in frontmatter:
    priority: high
              ^^^^

  Hint: Use a number like `priority: 3`
```

---

## 14.7 Extensions

Implementations MAY extend the specification with additional features:

- Custom field types
- Additional expression functions
- Query output formats
- Integration hooks
- Custom validation rules

Extensions SHOULD:
- Be clearly documented as non-standard
- Not conflict with standard behavior
- Be optional (spec-compliant usage should work without them)

Extensions SHOULD NOT:
- Change the meaning of standard features
- Require non-standard syntax for basic operations
- Break interoperability with compliant tools

---

## 14.8 Reporting Issues

If the specification is ambiguous or conflicts with practical implementation needs, please report issues to the specification maintainers. The goal is a spec that is:

- Clear and unambiguous
- Implementable in any language
- Useful for real-world applications
