# 10. Query Model

Queries retrieve files from the collection based on filters, with support for sorting, pagination, and computed fields. This section defines the query structure and semantics.

---

## 10.1 Query Overview

A query is a request to retrieve files matching certain criteria. Queries can:

- Filter by type
- Filter by frontmatter field values
- Filter by file metadata
- Filter by path patterns
- Sort results
- Paginate results
- Compute derived fields (formulas)

Queries operate on the collection as a flat list of files. The result is a list of file records matching the criteria.

---

## 10.2 Core Query Structure

A query is expressed as a YAML object with optional clauses:

```yaml
query:
  # Filter by type(s) - optional
  types: [task]
  
  # Filter by folder prefix - optional
  folder: "projects/alpha"
  
  # Filter expressions - optional
  where:
    and:
      - 'status != "done"'
      - "priority >= 3"
  
  # Sorting - optional
  order_by:
    - field: due_date
      direction: asc
    - field: priority
      direction: desc

  # Pagination - optional
  limit: 20
  offset: 0
```

**Core Query checklist:** `types`, `folder`, `where`, `order_by`, `limit`, `offset`, `include_body`

### Core vs Query+ Summary

| Clause | Core | Query+ |
|--------|------|--------|
| `types` | ✅ | — |
| `folder` | ✅ | — |
| `where` | ✅ | — |
| `order_by` | ✅ | — |
| `limit` / `offset` | ✅ | — |
| `include_body` | ✅ | — |
| `formulas` | — | ✅ |
| `groupBy` | — | ✅ |
| `summaries` | — | ✅ |
| `property_summaries` | — | ✅ |
| `properties` | — | ✅ |

---

## 10.3 Core Query Clauses

### `types`

Filter to files matching specified type(s):

```yaml
# Single type
types: [task]

# Multiple types (OR)
types: [task, note]
```

Files must match at least one of the listed types.

### `folder`

Filter to files within a folder (and subfolders):

```yaml
folder: "projects/alpha"
```

Matches files with paths starting with `projects/alpha/`.

### `where`

Filter by expression conditions. Can be:

**A single expression string:**
```yaml
where: 'status == "open"'
```

**A logical combination:**
```yaml
where:
  and:
    - 'status == "open"'
    - "priority >= 3"
    - or:
        - 'tags.contains("urgent")'
        - "due_date < today()"
    - not: "draft == true"
```

**Shape rules (Obsidian Bases-compatible):**
- A `where` value MAY be a string expression.
- A `where` value MAY be a logical object with one of the keys `and`, `or`, `not`.
- `and`/`or` values are lists of conditions (each condition is either a string expression or another logical object).
- `not` value is a single condition (string expression or logical object).

See [Expressions](./11-expressions.md) for the full expression language.

### `order_by`

Sort results by one or more fields:

```yaml
order_by:
  - field: due_date
    direction: asc      # ascending (oldest first)
  - field: priority
    direction: desc     # descending (highest first)
```

**Direction values:**
- `asc`: Ascending (A-Z, 1-9, oldest-newest)
- `desc`: Descending (Z-A, 9-1, newest-oldest)

**Null handling:** Null values sort last by default.
**Tie-breakers:** If all `order_by` fields compare equal, implementations MUST
apply a stable tie-breaker by ascending `file.path` to ensure deterministic output.

**Formula sorting:**
```yaml
order_by:
  - field: formula.urgency_score
    direction: desc
```

### String Collation

Default string ordering uses Unicode code point order (lexicographic comparison of Unicode scalar values):

- Comparison is case-sensitive by default: uppercase letters sort before lowercase (`"A" < "a"`)
- Null values sort LAST in ascending order and FIRST in descending order
- Implementations MAY support locale-aware collation as an `ext`-prefixed extension
- For `enum` fields, sort order follows the `values` list declaration order, not string order

### `limit` and `offset`

Paginate results:

```yaml
limit: 20    # Return at most 20 results
offset: 40   # Skip the first 40 results
```

Together these enable pagination: page 3 of 20 items = `offset: 40, limit: 20`.

---

## 10.4 Logical Operators in `where`

The `where` clause supports nested logical operators:

| Operator | YAML Key | Description |
|----------|----------|-------------|
| AND | `and:` | All conditions must be true |
| OR | `or:` | At least one condition must be true |
| NOT | `not:` | Condition must be false |

**Examples:**

```yaml
# AND: all must match
where:
  and:
    - 'status == "open"'
    - "priority >= 3"

# OR: any must match
where:
  or:
    - 'status == "blocked"'
    - "due_date < today()"

# NOT: must not match
where:
  not: 'status == "done"'

# Nested logic
where:
  and:
    - 'status != "done"'
    - or:
        - "priority >= 4"
        - 'tags.contains("urgent")'
```

Alternatively, use expression operators directly:

```yaml
where: 'status != "done" && (priority >= 4 || tags.contains("urgent"))'
```

---

## 10.5 Property Namespaces

In query expressions, properties are accessed through namespaces:

| Namespace | Description | Example |
|-----------|-------------|---------|
| (bare) | Frontmatter property | `status`, `priority` |
| `note.` | Explicit frontmatter (for reserved names) | `note.type`, `note["my-field"]` |
| `file.` | File metadata | `file.name`, `file.mtime` |
| `formula.` | Computed fields | `formula.overdue` |
| `this` | Context file (for embedded queries) | `this.file.name` |

### File Properties

| Property | Type | Description |
|----------|------|-------------|
| `file.name` | string | Filename with extension (e.g., `"task-001.md"`) |
| `file.basename` | string | Filename without final extension (e.g., `"task-001"`; for `"file.draft.md"` this is `"file.draft"`) |
| `file.path` | string | Full path from collection root |
| `file.folder` | string | Parent folder path |
| `file.ext` | string | File extension without dot (e.g., `"md"`) |
| `file.size` | number | File size in bytes |
| `file.ctime` | datetime | Created time |
| `file.mtime` | datetime | Modified time |
| `file.links` | list | Outgoing links (including links to non-markdown files) |
| `file.backlinks` | list | Incoming links (requires index) |
| `file.tags` | list | All tags (frontmatter `tags` + inline `#tags`, including nested) |
| `file.properties` | object | Raw persisted frontmatter properties only (no computed fields, no applied defaults) |
| `file.embeds` | list | All embed links in the file body |

### Body Content Properties

The `file.body` property provides access to the raw markdown body content (everything after the frontmatter closing `---`):

```yaml
# Find files that mention a keyword in their body
query:
  where: 'file.body.contains("TODO")'

# Case-insensitive body search
query:
  where: 'file.body.lower().contains("important")'

# Regex body search
query:
  where: 'file.body.matches("\\bAPI\\b")'
```

**Rules:**

- `file.body` is a string and supports all string methods from [§11.5](./11-expressions.md): `.contains()`, `.matches()`, `.lower()`, `.startsWith()`, etc.
- Body search operates on raw markdown text including syntax characters
- Content inside fenced code blocks IS included in `file.body` (it is the raw text)
- Implementations SHOULD support `file.body` in filters without requiring `include_body: true` in the query — the body is used for filtering, not necessarily returned in results
- **Performance note:** Body search without caching requires reading every file. Implementations SHOULD use full-text indexes when available
- **Note:** `file.body` includes content inside code blocks, but `file.links` and `file.tags` exclude links and tags inside code blocks (see [§8](./08-links.md)). This means `file.body.contains("[[foo]]")` may match a link that does not appear in `file.links`

### The `this` Context

In embedded queries (queries within a file), `this` refers to the containing file:

```yaml
# Find files linking to current file
where: "file.hasLink(this.file)"

# Find tasks assigned to current file's author
where: "assignee == this.author"
```

---

## 10.6 Result Structure

Query results return file objects with this structure:

```yaml
- path: "tasks/fix-bug.md"
  types: [task, urgent]
  frontmatter:
    id: "task-001"
    title: "Fix the login bug"
    status: open
    priority: 4
    tags: [bug, auth]
  formulas:
    overdue: true
    days_until_due: -3
  file:
    name: "fix-bug.md"
    folder: "tasks"
    mtime: "2024-03-15T10:30:00Z"
    size: 1234
  body: "..."  # Optional, if requested
```

### Result Envelope

Query results MUST include metadata alongside the result list:

```yaml
results:
  - path: "tasks/fix-bug.md"
    types: [task, urgent]
    frontmatter:
      id: "task-001"
      title: "Fix the login bug"
      # ...
meta:
  total_count: 142    # Total matching records (before limit/offset)
  limit: 20
  offset: 0
  has_more: true      # Whether more results exist beyond this page
```

**Fields:**

- `total_count`: The total number of records matching the query filters, ignoring `limit` and `offset`. Implementations MUST compute this accurately
- `has_more`: `true` if `offset + length(results) < total_count`
- When no `limit` is specified, `has_more` is `false` and `total_count` equals the result count

### Including Body Content

By default, body content is not included in results. To include it:

```yaml
query:
  include_body: true
```

This increases memory usage for large result sets.

---

## 10.7 Query+ (Optional Advanced Features)

The following clauses are OPTIONAL and are part of the Query+ profile. Implementations are not required to support Query+ to claim conformance at Level 3.

### `formulas`

Define computed fields evaluated for each result:

```yaml
formulas:
  overdue: "due_date < today() && status != 'done'"
  days_until_due: "due_date - today()"
  display_priority: 'if(priority >= 4, "🔴", if(priority >= 2, "🟡", "🟢"))'
```

Formulas are accessible via the `formula.` namespace in subsequent expressions and in results.

### `groupBy`

Group results by a property value. Each unique value creates a group:

```yaml
groupBy:
  property: status
  direction: ASC    # ASC or DESC
```

- Only one `groupBy` property is supported per query.
- `direction` controls the sort order of groups: `ASC` (default) or `DESC`.
- Results within each group follow the `order_by` sort.
- Ungrouped results (null/missing group value) appear in a separate group.

### `summaries`

Define custom summary formulas. In summary expressions, the `values` keyword represents all values for the associated property across the result set:

```yaml
summaries:
  custom_avg: "values.reduce(acc + value, 0) / values.length"
  rounded_mean: "values.reduce(acc + value, 0) / values.length"
```

**Summary semantics:**

- `values` is an ordered list matching the result order (or group order when `groupBy` is used).
- Missing properties contribute `null` values to `values`.
- Implementations SHOULD preserve `null` values in `values` for custom summaries.
- Built-in summaries SHOULD ignore `null`/empty values unless otherwise specified (e.g., `Empty`, `Filled`).

See [Expressions §11.14](./11-expressions.md) for default summary functions.

### `property_summaries`

Assign summary functions to specific properties. These calculate an aggregate value across all records (or per group when `groupBy` is used):

```yaml
property_summaries:
  priority: Average
  estimate_hours: Sum
  due_date: Earliest
  formula.overdue: Checked
```

Values reference either default summary names (see [Expressions §11.14](./11-expressions.md)) or custom summaries defined in the `summaries` section.

When `groupBy` is present, property summaries are computed **per group**.

### `properties`

Display configuration for properties. Does not affect query logic---used by view renderers:

```yaml
properties:
  status:
    displayName: "Current Status"
  formula.overdue:
    displayName: "Overdue?"
  file.ext:
    displayName: "Extension"
```

Display names are not used in filters or formulas.

---

## 10.8 Query Examples

### Core Examples

#### All Open Tasks

```yaml
query:
  types: [task]
  where: 'status == "open"'
```

#### High Priority Tasks Due This Week

```yaml
query:
  types: [task]
  where:
    and:
      - "priority >= 4"
      - "due_date <= today() + '7d'"
      - 'status != "done"'
```

#### Files Modified Today

```yaml
query:
  where: "file.mtime > today()"
```

#### Tasks Tagged Urgent or Blocker

```yaml
query:
  types: [task]
  where: 'tags.containsAny("urgent", "blocker")'
```

#### Tasks Assigned to Engineering Team Members

```yaml
query:
  types: [task]
  where: 'assignee.asFile().team == "engineering"'
```

#### Notes Linking to a Specific Task

```yaml
query:
  types: [note]
  where: 'file.hasLink(link("tasks/task-001"))'
```

#### Backlinks to Current File

```yaml
query:
  where: "file.hasLink(this.file)"
```

#### Files Matching Multiple Types

```yaml
query:
  where:
    and:
      - 'types.contains("actionable")'
      - 'types.contains("urgent")'
```

### Query+ Examples

#### Overdue Tasks Sorted by Priority

```yaml
query:
  types: [task]
  where:
    and:
      - "formula.is_overdue == true"
      - 'status != "blocked"'
  formulas:
    is_overdue: "due_date < today() && status != 'done'"
    urgency_score: "priority + if(due_date < today() - '7d', 5, 0)"
  order_by:
    - field: formula.urgency_score
      direction: desc
  limit: 10
```

#### Tasks Grouped by Status (Query+)

```yaml
query:
  types: [task]
  where: 'status != "cancelled"'
  groupBy:
    property: status
    direction: ASC
  property_summaries:
    priority: Average
    estimate_hours: Sum
  order_by:
    - field: priority
      direction: desc
```

#### Untyped Files

```yaml
query:
  where: "types.length == 0"
```

#### Paginated Results

```yaml
# Page 1
query:
  types: [task]
  order_by:
    - field: created_at
      direction: desc
  limit: 20
  offset: 0

# Page 2
query:
  types: [task]
  order_by:
    - field: created_at
      direction: desc
  limit: 20
  offset: 20
```

---

## 10.9 Query Optimization

Implementations SHOULD optimize queries where possible:

- **Index usage**: Use indexes for common filters (type, path prefix)
- **Short-circuit evaluation**: Stop evaluating OR clauses on first match
- **Lazy loading**: Don't parse body content unless requested
- **Caching**: Cache query results for repeated queries

Complex queries (link traversal, formulas) may require full scans. Implementations SHOULD document performance characteristics.

---

## 10.10 Query API Considerations

Implementations exposing queries via API SHOULD support:

**Programmatic access:**
```javascript
const results = await collection.query({
  types: ['task'],
  where: 'status == "open"',
  orderBy: [{ field: 'priority', direction: 'desc' }],
  limit: 10
});
```

**CLI access:**
```bash
mdbase query --type task --where 'status == "open"' --limit 10
```

The exact API surface is implementation-dependent.
