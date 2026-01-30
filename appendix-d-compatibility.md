# Appendix D: Compatibility Notes

This appendix describes compatibility with existing tools and migration paths from other systems.

---

## D.1 Obsidian Bases Compatibility

This specification was designed with Obsidian Bases compatibility as a goal. Many expression and query patterns are directly compatible.

### Compatible Features

| Feature | This Spec | Obsidian Bases |
|---------|-----------|----------------|
| Property access | `status`, `file.name` | Same |
| Comparison | `==`, `!=`, `<`, `>`, `<=`, `>=` | Same |
| Boolean logic | `&&`, `\|\|`, `!` | Same |
| Date functions | `now()`, `today()` | Same |
| Date arithmetic | `date + "7d"` | Same |
| String methods | `.contains()`, `.startsWith()` | Same |
| List methods | `.contains()`, `.length` | Same |
| Link traversal | `link.asFile()` | Same |
| File metadata | `file.mtime`, `file.path`, `file.tags` | Same |
| Context | `this.file`, `this.property` | Same |
| Logical structure | `and:`, `or:`, `not:` in YAML | Same |
| Type checking | `.isType("string")` | Same |
| Type conversion | `number()`, `list()`, `.toString()` | Same |
| List methods | `.unique()`, `.reduce()`, `.reverse()` | Same |
| String methods | `.lower()`, `.upper()`, `.split()` | Same |
| Summaries | `values` keyword, default functions | Same |
| Grouping | `groupBy` (single property) | Same |

### Extended Features

This specification adds features not in Obsidian Bases:

- Type definitions as markdown files (version-controlled schemas)
- Multi-type matching with constraint merging
- Formal validation with error codes and levels
- Rename with reference updates
- CRUD operations specification
- Generated fields (ULID, UUID, timestamps)
- Filename patterns with slug generation
- Match rules for automatic type assignment
- Nested collection detection
- Security considerations (ReDoS, resource limits)

### Differences

| Aspect | This Spec | Obsidian Bases |
|--------|-----------|----------------|
| Type storage | Markdown files in types folder | Obsidian internal |
| Configuration | `mdbase.yaml` | Obsidian settings |
| Views | Not specified (query only) | Table, Board, Gallery, etc. |
| Grouping | `groupBy` clause (single property, per §10.7) | Built-in groupBy |
| Summaries | `property_summaries` and custom `summaries` (per §10.7, §11.14) | Built-in summary functions |
| Lambda style | Implicit variables (`value`, `index`, `acc`); arrow syntax optional | Implicit variables |
| Method names | `.lower()`, `.upper()`, `.title()` | Same |

### Optional Compatibility Profile (Non-Normative)

Implementations MAY provide an optional "Bases compatibility" profile that mirrors Obsidian Bases query and expression behavior. This is **not** a required part of conformance. If provided, tools SHOULD document:

- Which Bases features are supported
- Any behavioral differences
- How to enable the profile (if applicable)

### Migration from Bases Queries

Most Bases queries work directly:

```yaml
# Bases query
types: [task]
where: 'status == "open"'
order_by:
  - field: due_date
    direction: asc

# This spec: identical!
```

---

## D.2 Dataview Compatibility

Dataview is a popular Obsidian plugin with its own query language. Here's how to migrate common patterns.

### Query Migration

| Dataview | This Spec |
|----------|-----------|
| `FROM "tasks"` | `folder: "tasks"` |
| `WHERE status = "open"` | `where: 'status == "open"'` |
| `WHERE contains(tags, "urgent")` | `where: 'tags.contains("urgent")'` |
| `SORT due_date ASC` | `order_by: [{field: due_date, direction: asc}]` |
| `LIMIT 10` | `limit: 10` |

### Full Example

**Dataview:**
```
TABLE title, status, due_date
FROM "tasks"
WHERE status != "done"
SORT due_date ASC
LIMIT 20
```

**This Spec:**
```yaml
query:
  folder: "tasks"
  where: 'status != "done"'
  order_by:
    - field: due_date
      direction: asc
  limit: 20
```

### Unsupported Dataview Features

| Feature | Notes |
|---------|-------|
| Inline fields (`field::`) | Not supported; use frontmatter |
| TABLE format | Implementations define output format |
| LIST format | Implementations define output format |
| TASK queries | Use `where` with checkbox fields |
| CALENDAR view | Implementation-specific |
| DataviewJS | Not applicable |

---

## D.3 Hugo/Jekyll Front Matter

Static site generators use frontmatter similarly but with different conventions.

### Hugo

Hugo uses specific frontmatter keys:

| Hugo | This Spec |
|------|-----------|
| `title` | Same (user-defined) |
| `date` | Same (user-defined) |
| `draft` | Same (user-defined) |
| `weight` | Same (user-defined) |
| `taxonomies` | Use `list` fields |

**Migration:** Hugo content mostly works directly. Define types that match your content structure.

### Jekyll

Jekyll collections map naturally:

```yaml
# Jekyll _config.yml
collections:
  posts:
    output: true
  projects:
    output: true

# This spec mdbase.yaml
spec_version: "0.1.0"
settings:
  types_folder: "_types"
# Define post and project types
```

---

## D.4 Notion Export Compatibility

When exporting from Notion to markdown:

### Database Properties → Frontmatter

Notion databases export properties as frontmatter:

```yaml
---
title: My Page
Status: In Progress
Due Date: 2024-03-15
Tags:
  - important
  - review
---
```

### Type Creation

Create types matching your Notion databases:

```yaml
# _types/notion-task.md
---
name: notion-task
fields:
  title:
    type: string
  Status:
    type: enum
    values: [Not Started, In Progress, Done]
  "Due Date":
    type: date
  Tags:
    type: list
    items:
      type: string
---
```

Note: Notion uses spaces in property names. Use bracket notation in queries: `note["Due Date"]`.

---

## D.5 Logseq Compatibility

Logseq uses a block-based structure with page properties.

### Page Properties

Logseq page properties map to frontmatter:

```markdown
title:: My Page
status:: open
tags:: #task #urgent
```

Becomes:
```yaml
---
title: My Page
status: open
tags: [task, urgent]
---
```

### Block Properties

Logseq block properties don't have a direct equivalent. Consider:
- Converting important blocks to separate files
- Using structured frontmatter objects
- Using the body for detailed content

---

## D.6 Tana Compatibility

Tana exports use a specific JSON/markdown format. Key mappings:

| Tana | This Spec |
|------|-----------|
| Supertags | Types |
| Fields | Frontmatter fields |
| References | Links |

---

## D.7 Migration Strategies

### Incremental Migration

1. **Start untyped**: Import files without types
2. **Add types gradually**: Create types for one category at a time
3. **Enable validation**: Move from `off` to `warn` to `error`
4. **Enforce strictness**: Enable `strict: true` when ready

### Automated Migration

```bash
# 1. Initialize collection
mdbase init

# 2. Scan existing files and suggest types
mdbase infer-types --output _types/

# 3. Review and adjust generated types
# (manual step)

# 4. Validate and fix issues
mdbase validate --fix --dry-run
mdbase validate --fix
```

### Handling Legacy Fields

For fields that don't fit the new schema:

```yaml
# Option 1: Type with any field for legacy data
fields:
  legacy:
    type: any
    deprecated: true

# Option 2: Loose strictness during migration
strict: false  # Allow unknown fields
```

---

## D.8 Tool-Specific Notes

### VS Code

- Extensions can parse `mdbase.yaml` for IntelliSense
- Frontmatter validation possible via YAML schemas
- Query preview via custom webviews

### Vim/Neovim

- YAML syntax highlighting works for frontmatter
- Custom commands can invoke CLI tools
- LSP integration possible for validation

### Emacs

- Org-mode users: consider bidirectional sync
- Markdown-mode with YAML support
- Custom functions for query execution

---

## D.9 Interoperability Best Practices

1. **Stick to common field types**: String, integer, date, list work everywhere
2. **Avoid tool-specific features**: Keep frontmatter portable
3. **Use standard date formats**: ISO 8601 always
4. **Keep links simple**: Wikilinks are most portable
5. **Document your schema**: Types are self-documenting
6. **Version your types**: Track schema changes in git
