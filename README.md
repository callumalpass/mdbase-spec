# mdbase specification

A specification for tools that treat folders of markdown files as typed, queryable data collections.

Version 0.1.0 (draft).

**Read the spec:** [mdbase.dev](https://mdbase.dev)

## Motivation

Markdown files with YAML frontmatter are widely used as structured content. Static site generators (Hugo, Jekyll, Astro), knowledge management tools (Obsidian, Logseq), documentation systems, and AI agent frameworks all read and write markdown files with frontmatter fields like `title`, `date`, `tags`, and `status`.

These tools have each developed their own conventions for how frontmatter is interpreted, how files relate to schemas, how queries work, and what happens when a file is created or renamed. The conventions are similar enough to suggest a common model, but different enough that files written for one tool often need adjustment to work with another.

This spec defines that common model. It covers the full lifecycle: loading type definitions, matching files to types, validating fields, evaluating expressions, executing queries, performing CRUD operations, and maintaining link consistency. The intent is that a CLI tool, an editor plugin, and a programmatic library can all operate on the same collection of files and agree on what the data means.

Three specific problems motivated the spec:

1. **No shared schema language for frontmatter.** Tools that validate frontmatter each define their own schema formats. A type definition written for one tool cannot be used by another. This spec defines a single schema format (itself markdown with YAML frontmatter) that any conforming tool can read.

2. **No portable query semantics.** Obsidian Dataview, Hugo's `where` function, and various static site generators each have different filtering and sorting syntax. This spec defines an expression language and query model so that a query written once produces the same results in any conforming tool.

3. **AI agents need structured, human-readable storage.** Agents that persist state as markdown files currently rely on ad hoc conventions. This spec gives agents a defined contract for reading, writing, and querying typed markdown, while keeping the files readable and editable by humans.

### Design principles

- **Files are the source of truth.** Indexes and caches are derived and disposable.
- **Human-readable first.** No proprietary formats. A text editor is sufficient.
- **Progressive strictness.** Collections work with no schema at all. Validation is opt-in.
- **Portable.** No vendor lock-in. Collections work with any conforming tool.
- **Git-friendly.** All persistent state is plain text suitable for version control.

## What this defines

A collection is a folder containing an `mdbase.yaml` config file, a `_types/` folder with type definitions (themselves markdown files), and any number of markdown content files. The spec defines how conforming tools should:

- Parse YAML frontmatter, including null semantics and serialization rules
- Load type definitions and resolve inheritance
- Match files to types by explicit declaration, path globs, or field presence
- Validate frontmatter against type schemas (12 field types, configurable strictness)
- Evaluate an expression language for filtering and sorting
- Execute queries with where clauses, ordering, pagination, grouping, and summaries
- Parse and resolve links (wikilinks, markdown links, bare paths)
- Perform create, read, update, delete, and rename operations
- Update references when files are renamed
- Cache and index files for query performance
- Watch for filesystem changes

## Spec structure

| Section | File | Content |
|---------|------|---------|
| §0 | `00-overview.md` | Abstract, motivation, how it works |
| §1 | `01-terminology.md` | Definitions |
| §2 | `02-collection-layout.md` | Folder structure, file scanning |
| §3 | `03-frontmatter.md` | YAML frontmatter parsing, null handling, serialization |
| §4 | `04-configuration.md` | `mdbase.yaml` schema |
| §5 | `05-types.md` | Type definitions, inheritance, computed fields |
| §6 | `06-matching.md` | File-to-type matching rules |
| §7 | `07-field-types.md` | string, integer, number, boolean, date, datetime, time, enum, list, object, link, tags |
| §8 | `08-links.md` | Link syntax, resolution algorithm, traversal |
| §9 | `09-validation.md` | Validation levels, error reporting |
| §10 | `10-querying.md` | Query model, clauses, body search |
| §11 | `11-expressions.md` | Operators, methods, functions, date arithmetic |
| §12 | `12-operations.md` | CRUD, rename, batch operations, concurrency |
| §13 | `13-caching.md` | SQLite/indexing, staleness detection |
| §14 | `14-conformance.md` | 6 conformance levels, test suite format |
| §15 | `15-watching.md` | Watch mode, event types, debouncing |
| A | `appendix-a-examples.md` | Worked examples |
| B | `appendix-b-expression-grammar.md` | Formal grammar for expressions |
| C | `appendix-c-error-codes.md` | 34 error codes with categories |
| D | `appendix-d-compatibility.md` | Interop with Obsidian, Hugo, etc. |

## Conformance levels

Implementations can claim partial conformance. Each level requires all previous levels.

| Level | Name | Adds |
|-------|------|------|
| 1 | Core | Config, frontmatter, types, validation, CRUD |
| 2 | Matching | Path globs, field presence, multi-type, constraint merging |
| 3 | Querying | Expressions, queries, body search, computed fields |
| 4 | Links | Link parsing, resolution, `asFile()` traversal |
| 5 | References | Rename with ref updates, backlinks |
| 6 | Full | Caching, batch ops, watch mode |

## Conformance tests

The `tests/` directory contains YAML test files organized by level. Each file defines setup (config, types, content files) and test cases with operations and expected results. See `14-conformance.md` §14.3 for the test format.

```
tests/
├── level-1/    # config, types, validation, operations, concurrency
├── level-2/    # matching rules
├── level-3/    # expressions, queries
├── level-4/    # links
├── level-5/    # references
└── level-6/    # caching, watching
```

## Implementations

| Project | Language | Status |
|---------|----------|--------|
| [mdbase](https://github.com/callumalpass/mdbase) | TypeScript | Early release |
| [mdbase-rs](https://github.com/callumalpass/mdbase-rs) | Rust | Early release |
| [mdbase-lsp](https://github.com/callumalpass/mdbase-lsp) | Rust | Early release (LSP server) |
| [mdbase-cli](https://github.com/callumalpass/mdbase-cli) | TypeScript | Early release (CLI tool with .base file support) |

## License

CC BY 4.0
