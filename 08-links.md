# 08. Links

## Link Values

mdbase recognizes three link syntaxes:

| Syntax | Example |
| --- | --- |
| Wikilink | `[[people/alice|Alice]]` |
| Markdown link | `[Alice](people/alice.md)` |
| Bare path | `people/alice.md` |

A field becomes link-aware through `collection.links`, not through JSON Schema.

The JSON Schema shape is usually `string` or `array` of `string`.

## Link Components

Parsed links expose:

- `raw`
- `target`
- `alias`
- `anchor`
- `format`
- `is_relative`

`format` is one of `wikilink`, `markdown`, or `path`.

## Resolution

Resolution is performed against the collection root and the containing file.

General rules:

- Markdown links and bare relative paths resolve relative to the containing
  file's folder.
- Absolute collection paths use `/` from the collection root.
- Wikilinks with `/`, `./`, or `../` use path-style resolution.
- Simple wikilinks without path separators first try ID-based resolution using
  the configured `id_field`, then filename resolution.

After normalization, a link that escapes the collection root is invalid.

## Ambiguity

If multiple records have the same configured ID, ID-based resolution is
ambiguous and MUST fail.

If filename resolution finds multiple candidates, tools SHOULD apply stable
tiebreakers:

1. same directory as referring file
2. shortest collection path
3. alphabetical path

If ambiguity remains, resolution returns null and reports an ambiguous link
warning.

## Target Constraints

`collection.links` can require a target type:

```yaml
collection:
  links:
    assignee:
      target_type: person
      validate_exists: true
```

When `validate_exists` is true, unresolved links are validation errors at
validation level `error`.

When `target_type` is present, a resolved target is valid only if it matches the
target type.

## Body Links

`file.links` includes:

- frontmatter link fields declared in `collection.links`
- body wikilinks
- body Markdown links

`file.embeds` includes Markdown and wikilink embeds.

Links and tags inside fenced code blocks and inline code MUST be ignored by
body extraction.

## Tags

`file.tags` includes:

- frontmatter tags from `tags` when the field is string or list of strings
- inline body tags beginning with `#`

Inline tags must begin at the start of a line or after whitespace. URL
fragments MUST NOT be treated as tags.

`file.hasTag("project")` matches `#project` and `#project/alpha`, but not
`#projection`.

## Link Host Functions

The CEL profile defines host functions and methods for links:

- `link(value)`
- `file.hasLink(linkValue)`
- `file.hasTag(tag)`
- `file.asLink()`
- `linkValue.asFile()`

Broken links resolve to null. Property access through null returns null under
the mdbase CEL profile.

## Round Trip

Write operations SHOULD preserve link format when updating references:

- wikilinks remain wikilinks
- Markdown links remain Markdown links
- bare paths remain bare paths
- aliases and anchors are preserved where possible

ID-based links SHOULD NOT be rewritten during rename if the target ID did not
change.
