---
type: chapter
id: 02-collection-layout
title: "Collection Layout"
description: "How collections are identified, how files are discovered, and overall structure"
section: 2
conformance_levels: [1]
test_categories: [config]
depends_on:
  - "[[01-terminology]]"
---

# 2. Collection Layout

This section defines how collections are identified, how files are discovered, and the overall structure of a compliant collection.

---

## 2.1 Identifying a Collection

A directory is recognized as a collection if and only if it contains a file named `mdbase.yaml` at its root. This file is the **collection root marker**. The directory containing this file is the **collection root**, and all paths in the specification are relative to this directory.

```
my-project/
├── mdbase.yaml           # Collection root marker
├── _types/             # Type definition files (configurable location)
│   ├── task.md
│   └── note.md
├── tasks/
│   ├── fix-bug.md
│   └── write-docs.md
├── notes/
│   └── meeting-2024-01.md
└── README.md
```

If a directory does not contain `mdbase.yaml`, it is not a collection. Implementations MUST NOT treat arbitrary directories of markdown files as collections without this marker.

---

## 2.2 File Discovery

### Included Files

Implementations MUST scan the collection root and, by default, all subdirectories (recursively) for markdown files.

A file is considered a **markdown file** if:

1. It has the extension `.md`, OR
2. It has an extension listed in `settings.extensions` in the config file (e.g., `.mdx`, `.markdown`)

Implementations MUST treat files with these extensions as collection members (records).

### Excluded Paths

Implementations MUST exclude certain paths from scanning:

1. The `mdbase.yaml` config file itself (it is not a record)
2. Paths listed in `settings.exclude` in the config file
3. The types folder (by default `_types/`, configurable via `settings.types_folder`)
4. The cache folder if present (by default `.mdbase/`)

Default exclusions (applied unless overridden):
- `.git`
- `node_modules`
- `.mdbase`

### Symlinks

Implementations MAY follow symlinks during scanning, but MUST prevent the resolved path from
escaping the collection root. Symlinks that resolve outside the collection MUST be ignored
with a warning.

### Subdirectory Scanning

By default, implementations MUST scan subdirectories recursively. This behavior can be disabled by setting `settings.include_subfolders: false` in the config file.

When subdirectory scanning is disabled, only files directly in the collection root are considered records.

---

## 2.3 The Types Folder

Type definitions are stored as markdown files in a designated folder. By default, this folder is `_types/` at the collection root, but it can be configured via `settings.types_folder`.

```yaml
# mdbase.yaml
settings:
  types_folder: "_schemas"  # Use _schemas/ instead of _types/
```

The types folder:

- MUST be excluded from the regular file scan (type files are not records)
- MUST be scanned separately to load type definitions
- MAY contain subdirectories for organization (all `.md` files are scanned)

See [Types](./05-types.md) for the format of type definition files.

---

## 2.4 Path Conventions

All paths in the specification and in queries use forward slashes (`/`) regardless of operating system. Implementations on Windows MUST normalize backslashes to forward slashes.

Paths are relative to the collection root unless explicitly stated otherwise.

**Examples:**
- `tasks/fix-bug.md` refers to a file in the `tasks` subdirectory
- `./sibling.md` in a link is relative to the containing file's directory
- `../other/file.md` in a link navigates up one directory

---

## 2.5 Reserved Names

The following names have special meaning and SHOULD NOT be used as regular record filenames:

| Name | Purpose |
|------|---------|
| `mdbase.yaml` | Collection configuration |
| `_types/` | Default types folder (configurable) |
| `.mdbase/` | Default cache folder |

Implementations SHOULD warn if a user attempts to create a record with a reserved name.

---

## 2.6 Minimal Collection Example

The simplest valid collection consists of a config file and zero or more markdown files:

```
minimal/
├── mdbase.yaml
└── hello.md
```

**mdbase.yaml:**
```yaml
spec_version: "0.2.1"
```

**hello.md:**
```markdown
---
title: Hello World
---

This is a minimal collection with one untyped file.
```

This collection has no types defined. The single file is untyped but still a valid record. As the collection grows, types can be added incrementally.

---

## 2.7 Recommended Collection Structure

While the specification allows flexibility, the following structure is recommended for clarity:

```
my-collection/
├── mdbase.yaml               # Required: collection configuration
├── _types/                 # Type definitions
│   ├── task.md
│   ├── note.md
│   └── person.md
├── .mdbase/                  # Cache (gitignored)
│   └── index.sqlite
├── tasks/                  # Records organized by type or purpose
│   ├── task-001.md
│   └── task-002.md
├── notes/
│   └── weekly-review.md
├── people/
│   └── alice.md
└── README.md               # Documentation (also a record unless excluded)
```

Note that `README.md` is a valid record in this structure. If you want to exclude documentation files from the collection, add them to `settings.exclude`.

---

## 2.8 Nested Collections

If a subdirectory within a collection also contains an `mdbase.yaml` file, it defines an **independent nested collection**:

- The parent collection's scan MUST NOT descend into the nested collection.
- The nested collection's files are NOT records of the parent collection.
- The nested `mdbase.yaml` acts as a boundary marker, similar to exclude patterns.
- Implementations SHOULD automatically exclude directories containing `mdbase.yaml`.

```
my-collection/
├── mdbase.yaml          # Parent collection
├── tasks/
│   └── task-001.md      # Record in parent
└── sub-project/
    ├── mdbase.yaml      # Nested collection (independent)
    └── docs/
        └── readme.md    # Record in sub-project, NOT in parent
```

This behavior ensures that collections remain self-contained and do not interfere with each other.

---

## 2.9 Non-Markdown Files

Collections may contain non-markdown files such as images, PDFs, or other binary assets. These files are NOT records — they have no frontmatter and are not returned by queries.

### Status in the Collection

- Non-markdown files are **valid link targets**: `[[photo.png]]` and `![img](photo.png)` resolve normally
- They appear in `file.links` when referenced via non-embed link syntax (e.g., `[[photo.png]]`)
- They appear in `file.embeds` when referenced via embed syntax (`![[...]]` or `![](...)`)
- Non-markdown files are not assigned types and cannot be validated against type schemas

### File Discovery

- File discovery MUST skip non-markdown files when building the record set
- File discovery MUST NOT skip non-markdown files during link resolution — links to images, PDFs, and other assets MUST resolve by path
- Implementations MUST resolve links to non-markdown files by path only (no `id_field` lookup, since non-markdown files are not records and have no frontmatter)

### Example

```
my-collection/
├── mdbase.yaml
├── tasks/
│   └── task-001.md        # Record (included in queries)
├── images/
│   ├── diagram.png        # Not a record, but valid link target
│   └── screenshot.jpg     # Not a record, but valid link target
└── attachments/
    └── report.pdf         # Not a record, but valid link target
```

In `task-001.md`:
```yaml
---
type: task
title: Fix the layout
---

See the [[images/diagram.png]] for reference.

![[images/screenshot.jpg]]
```

Here, `diagram.png` appears in `file.links` because it uses non-embed link syntax; `screenshot.jpg` appears in `file.embeds` because it uses embed syntax.
