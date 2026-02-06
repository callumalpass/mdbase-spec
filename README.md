# mdbase specification

A specification for treating a folder of markdown files with YAML frontmatter as a typed, queryable data collection.

Version 0.2.0.

**Read the spec:** [mdbase.dev](https://mdbase.dev)

## Motivation

If you use Obsidian (or a similar tool) and you've accumulated notes for meetings, contacts, projects, reading, journal entries, and so on, each with frontmatter fields, your vault is functioning as a database. The property system encourages this: you define fields, assign types, and the tool enforces them across files. But the tooling for managing that structure is limited. If you want all your meeting notes to have a `date`, `attendees`, and `status` field---and you want that enforced---your options are a template (which helps at creation time but not after) and perhaps a Linter rule. There is no schema file that lives alongside your notes. There is no file in your vault that says "a meeting note looks like this, with these fields, of these types."

This means each tool that touches your vault---Obsidian itself, an editor, a templating plugin, an AI agent---has to independently work out what your types are, or you have to tell each one separately. In practice, the same structural assumptions end up encoded in templates, Dataview queries, Linter configs, and agent prompts, and they drift apart.

mdbase-spec tries to address this. The core idea is that types are defined as files---markdown files in a `_types/` folder, where the frontmatter declares the schema and the body can document the type in prose. A template becomes a consequence of a type definition rather than a substitute for one, and validation can happen at write time rather than only at creation time. Because type definitions are just files in the vault, they are versioned with everything else, human-readable, and editable in any text editor.

The spec defines how those type files, and the collections they describe, should be interpreted, so that different tools can treat them consistently. It covers type definitions and inheritance, file-to-type matching (by explicit declaration, path globs, or field presence), an expression language for filtering and sorting (designed for compatibility with Obsidian Bases syntax), link parsing and resolution, and the semantics of create, read, update, delete, and rename operations.

A spec rather than a library is deliberate. If you can reduce a problem to a spec with a test suite, you can set a coding agent loose on it and get a conforming library in whatever language you need. What is harder, and worth spending time on, is getting the semantics right, because that is what determines whether independently-built tools agree on what a "meeting note" means and how a link is resolved.

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

## Example applications

| Project | Description |
|---------|-------------|
| [mdbase-workouts](https://github.com/callumalpass/mdbase-workouts) | Workout tracker with chat interface, built on mdbase |

## License

MIT
