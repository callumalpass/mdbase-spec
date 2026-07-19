# 03. Records And Frontmatter

## Markdown Record Structure

A Markdown record may begin with YAML frontmatter delimited by `---` on the
first line:

```markdown
---
type: task
title: Fix login
status: open
---

Body text.
```

If the first non-byte-order-mark bytes are not `---` followed by a line ending,
the file has no frontmatter and the full file is body text.

Whitespace or a blank line before the opening delimiter means there is no
frontmatter.

## Frontmatter Value

Frontmatter MUST parse to a YAML mapping. Empty frontmatter is an empty mapping.

If frontmatter is absent, the raw frontmatter object is `{}`.

If frontmatter parses to a scalar, sequence, or other non-mapping value, the
record is invalid at validation level `error`. At validation level `warn`, tools
SHOULD treat it as empty frontmatter and report a warning.

## Missing, Null, And Empty

Frontmatter has four distinct states:

- missing means a key is not present in persisted frontmatter
- null means a key is present with YAML null
- empty string means a key is present with `""`
- empty list means a key is present with `[]`

These states are not interchangeable.

`collection.read_defaults` applies only to missing keys. It does not replace
explicit null.

## Raw And Effective Records

A raw record is the persisted frontmatter object plus file metadata and body.

An effective record is a read/query view that may apply `collection.read_defaults`
for matched types.

Validation of JSON Schema `required` is against the raw or draft persisted
frontmatter object, not against effective read defaults.

## Body

The body is the Markdown content after the closing frontmatter delimiter. The
body is not validated by JSON Schema unless a type explicitly models it through
a separate mdbase feature.

The body may participate in queries through `file.body` when body indexing is
enabled or when a tool can read bodies on demand.

## File Metadata

Every record exposes a file object to expressions and query results:

| Property | Meaning |
| --- | --- |
| `file.path` | collection-relative path |
| `file.name` | basename with extension |
| `file.basename` | basename without the final extension |
| `file.ext` | extension without dot |
| `file.folder` | collection-relative containing folder |
| `file.size` | byte size where available |
| `file.mtime` | modified timestamp where available |
| `file.ctime` | created timestamp where available |
| `file.body` | Markdown body when included or needed for filtering |

File metadata is derived. It MUST NOT be written into frontmatter unless a tool
explicitly maps it to ordinary fields.

## Serialization

Write-capable tools SHOULD preserve unrelated body text and line ending style.

When serializing frontmatter, tools SHOULD:

- omit missing values; bare nulls represent explicit null values
- quote empty strings
- preserve array/object structure
- produce deterministic key ordering when the operation rewrites a generated
  file

When updating a field to null, tools MAY either persist explicit null or remove
the key depending on operation policy. The operation result MUST make the chosen
behavior explicit.

## YAML Profile

Implementations MUST parse UTF-8 Markdown files.

The v0.3 YAML profile SHOULD use a safe YAML parser and MUST NOT execute custom
tags.

Tools SHOULD normalize common YAML scalar forms into the corresponding JSON
data model before JSON Schema validation. Non-JSON YAML values such as NaN,
Infinity, binary values, and timestamps with parser-specific objects MUST be
handled by the mdbase YAML profile before schema validation or rejected with a
clear diagnostic.
