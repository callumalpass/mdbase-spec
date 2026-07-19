---
type: chapter
id: 01-terminology
title: "Terminology"
description: "Definitions of key terms used throughout the specification"
section: 1
conformance_levels: [1]
---

# 1. Terminology

This section defines the key terms used throughout the specification. Understanding these definitions is essential for correctly interpreting the requirements.

---

## Core Concepts

**Collection**  
A directory (and optionally its subfolders) containing markdown files managed as a unit. A collection is identified by the presence of an `mdbase.yaml` configuration file at its root. The collection is the fundamental unit of organization—all operations, queries, and validations occur within the scope of a single collection.

**Collection Root**  
The directory containing the `mdbase.yaml` configuration file. All paths in the specification are relative to this directory unless otherwise stated.

**File** (or **Record**)  
A markdown file within a collection. Files have the extension `.md` (or optionally `.mdx` or `.markdown` if configured). Each file represents a single record in the collection—analogous to a row in a database table, but richer: it has structured frontmatter, unstructured body content, and file system metadata.

**Frontmatter**  
YAML metadata at the beginning of a file, delimited by `---` markers. The frontmatter is a YAML mapping (object) containing the structured fields of the record.

```markdown
---
title: My Document
tags: [important, review]
---

The body content begins here.
```

**Body**  
The markdown content following the frontmatter. The body is treated as opaque content by default—this specification primarily concerns itself with frontmatter structure. Body querying is optional unless an implementation claims Level 3+ conformance, in which case `file.body` filtering is required.

**Type**  
A named schema defining the expected frontmatter fields, their types, constraints, and validation rules for a category of files. Types are themselves defined as markdown files in a designated folder, making them versionable and documentable. A file may be associated with zero, one, or multiple types.

**Type Definition File**  
A markdown file in the types folder whose frontmatter defines a type schema. The body of the file can contain documentation, examples, and usage notes for the type.

**Untyped File**  
A file that is not associated with any type. Untyped files are valid members of a collection—they simply have no schema constraints applied to them. This allows for gradual adoption of typing.

**Config File**  
The `mdbase.yaml` file at the collection root. This file defines global settings, the location of type definitions, and collection-wide behavior. It does not contain type definitions themselves—those live in separate markdown files.

---

## Operations and Queries

**Expression**  
A string that evaluates to a value, used in query filters and computed formulas. Expressions follow the syntax defined in the [Expression Language](./11-expressions.md) section.

**Query**  
A request to retrieve files matching certain criteria. Queries can filter by type, field values, file metadata, and path patterns, with results sorted and paginated.

**Formula**  
A computed field defined by an expression. Formulas are evaluated at query time and can be used for filtering, sorting, and display.

**Validation**  
The process of checking whether a file's frontmatter conforms to the schemas of its matched types. Validation can report issues, warn, or fail operations depending on configuration.

---

## Links and References

**Link**  
A reference from one file to another, expressed in frontmatter or body content. Links can use wikilink syntax (`[[target]]`), markdown link syntax (`[text](path.md)`), or bare paths.

**Resolution**  
The process of determining which file a link refers to. Resolution takes into account relative paths, collection-wide search, and optional type-scoped lookups.

**Backlink**  
An incoming link—a reference to a file from another file. Backlinks require indexing to compute efficiently and are an optional feature.

---

## Implementation Terms

**Implementation**  
Any tool, library, or application that reads, writes, or operates on collections according to this specification.

**Conformance Level**  
A defined subset of the specification that an implementation may claim to support. See [Conformance](./14-conformance.md) for the defined levels.

**Cache**  
An optional derived data store that accelerates queries. Caches MUST be rebuildable from the source files and MUST NOT be the source of truth.

---

## RFC 2119 Keywords

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119).

In brief:

- **MUST** / **REQUIRED** / **SHALL**: Absolute requirement
- **MUST NOT** / **SHALL NOT**: Absolute prohibition  
- **SHOULD** / **RECOMMENDED**: There may be valid reasons to ignore, but implications must be understood
- **SHOULD NOT** / **NOT RECOMMENDED**: There may be valid reasons to do it, but implications must be understood
- **MAY** / **OPTIONAL**: Truly optional; implementations may or may not include the feature
