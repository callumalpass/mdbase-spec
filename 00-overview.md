---
type: chapter
id: 00-overview
title: "Overview"
description: "Abstract, motivation, design principles, and specification structure"
section: 0
normative: false
---

# Typed Markdown Collections Specification

**Version:** 0.1.0  
**Status:** Draft  
**Last Updated:** 2026-01-30

---

## Abstract

This specification defines the behaviour of tools that treat folders of markdown files as typed, queryable data collections. It covers schema definition, field types, validation, querying, and CRUD operations.

---

## Motivation

Markdown files with YAML frontmatter are a common way to store structured content. The pattern appears in static site generators, knowledge management tools like Obsidian, documentation systems, and increasingly in AI agent frameworks that use markdown for persistent state.

Each of these ecosystems has developed its own conventions for frontmatter structure, querying, and validation. This specification defines one coherent set of behaviours so that:

- A CLI tool and an editor plugin can operate on the same files with consistent semantics
- An AI agent can read and write markdown files that a human can also inspect and edit
- Tool authors have a behaviour contract to implement against rather than inventing new conventions

### Intended implementers

**CLI tools** for querying, validating, and manipulating markdown collections from the command line.

**Editor plugins** (for Obsidian, VS Code, etc.) that provide validation, autocomplete, and query interfaces. The expression syntax is designed for compatibility with Obsidian Bases.

**Libraries** in various languages that other applications can use to work with typed markdown.

**AI agent frameworks** that need structured, human-readable persistent storage.

---

## What a conforming tool does

A tool implementing this specification:

1. **Recognises collections** by the presence of an `mdbase.yaml` config file
2. **Loads type definitions** from markdown files in a designated folder
3. **Matches files to types** based on explicit declaration or configurable rules
4. **Validates frontmatter** against type schemas, reporting errors at configurable severity levels
5. **Executes queries** using an expression language for filtering and sorting (with optional advanced features like grouping and summaries)
6. **Performs CRUD operations** with validation, default values, and auto-generated fields
7. **Updates references** when files are renamed, keeping links consistent across the collection

The specification defines the expected behaviour for each of these capabilities, along with conformance levels for partial implementations.

---

## Design Principles

**Files are the source of truth.** Tools read from and write to the filesystem. Indexes and caches are derived and disposable.

**Human-readable first.** Tools should not require proprietary formats. A user with a text editor should be able to read and modify any file.

**Progressive strictness.** Tools should work on collections with no schema at all. Validation is opt-in and configurable.

**Portable.** Collections should work with any conforming tool. No vendor lock-in.

**Git-friendly.** All persistent state is text files suitable for version control.

---

## How It Works

### A collection is a folder with an `mdbase.yaml` marker

```
my-project/
├── mdbase.yaml            # Marks this folder as a collection
├── _types/                # Type definitions (schemas)
│   ├── task.md
│   └── person.md
├── tasks/
│   ├── fix-bug.md         # A record of type "task"
│   └── write-docs.md
└── people/
    └── alice.md           # A record of type "person"
```

The minimal config just declares the spec version:

```yaml
# mdbase.yaml
spec_version: "0.1.0"
```

### Types are defined as markdown files

A type is a schema for a category of files. Types live in the `_types/` folder and are themselves markdown — the frontmatter defines the schema, the body documents it.

```markdown
---
name: task
fields:
  title:
    type: string
    required: true
  status:
    type: enum
    values: [open, in_progress, done]
    default: open
  priority:
    type: integer
    min: 1
    max: 5
  assignee:
    type: link
    target: person
---

# Task

A task represents a unit of work. Set `status` to track progress.
```

### Records are markdown files with typed frontmatter

A file declares its type and provides field values in frontmatter. The body is free-form markdown.

```markdown
---
type: task
title: Fix the login bug
status: in_progress
priority: 4
assignee: "[[alice]]"
tags: [bug, auth]
---

The login form throws a validation error when the email contains a `+` character.
```

### Queries filter and sort records using expressions

Queries are YAML objects with optional clauses for filtering, sorting, and pagination:

```yaml
query:
  types: [task]
  where:
    and:
      - 'status != "done"'
      - "priority >= 3"
  order_by:
    - field: due_date
      direction: asc
  limit: 20
```

The expression language supports field access, comparison, boolean logic, string and list methods, date arithmetic, and link traversal:

```
status == "open" && tags.contains("urgent")
due_date < today() + "7d"
assignee.asFile().team == "engineering"
```

### Validation is progressive

Collections work with no types at all — every file is an untyped record. Types can be added incrementally, and validation severity is configurable per-collection or per-type (`off`, `warn`, `error`). Strictness controls whether unknown fields are allowed, warned, or rejected.

### Links connect records across the collection

Records can reference each other using wikilinks (`[[alice]]`) or markdown links (`[Alice](../people/alice.md)`). When a file is renamed, conforming tools update all references automatically.

### Conformance is levelled

Implementations don't need to support everything. Six conformance levels let tools start with basic CRUD (Level 1) and progressively add matching, querying, links, reference updates, and caching. See [§14](./14-conformance.md) for details.

---

## Specification Structure

| Document | Description |
|----------|-------------|
| [01-terminology.md](./01-terminology.md) | Definitions of key terms |
| [02-collection-layout.md](./02-collection-layout.md) | How tools identify and scan collections |
| [03-frontmatter.md](./03-frontmatter.md) | Frontmatter parsing, null semantics, serialization |
| [04-configuration.md](./04-configuration.md) | The `mdbase.yaml` configuration file |
| [05-types.md](./05-types.md) | Type definitions as markdown files |
| [06-matching.md](./06-matching.md) | How tools match files to types |
| [07-field-types.md](./07-field-types.md) | Primitive and composite field types |
| [08-links.md](./08-links.md) | Link syntax, parsing, resolution |
| [09-validation.md](./09-validation.md) | Validation levels and error reporting |
| [10-querying.md](./10-querying.md) | Query model, filters, sorting |
| [11-expressions.md](./11-expressions.md) | Expression language for filters and formulas |
| [12-operations.md](./12-operations.md) | Create, Read, Update, Delete, Rename |
| [13-caching.md](./13-caching.md) | Optional caching and indexing |
| [14-conformance.md](./14-conformance.md) | Conformance levels and testing |
| [15-watching.md](./15-watching.md) | Watch mode and change events |
| [Appendix A](./appendix-a-examples.md) | Complete examples |
| [Appendix B](./appendix-b-expression-grammar.md) | Formal expression grammar |
| [Appendix C](./appendix-c-error-codes.md) | Standard error codes |
| [Appendix D](./appendix-d-compatibility.md) | Compatibility with existing tools |

---

## Versioning

This specification uses semantic versioning. The current version is **0.1.0**, indicating a draft in active development. Breaking changes may occur before 1.0.0.

Tools should declare which specification version they implement and should reject configuration files with unsupported `spec_version` values.

---

## License

This specification is released under the [MIT License](https://opensource.org/licenses/MIT).
