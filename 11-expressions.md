# 11. Expression Language

Expressions are strings that evaluate to values. They are used in query filters, match conditions, and computed formulas. This section defines the expression syntax and available functions.

---

## 11.1 Expression Context

Expressions are evaluated in a context that provides:

- **Frontmatter fields**: Direct access via bare names
- **File metadata**: Via `file.` prefix
- **Formula values**: Via `formula.` prefix
- **Context reference**: Via `this` (in embedded queries)
- **Built-in functions**: Date functions, type checks, etc.

---

## 11.2 Literals

### Strings

```javascript
"hello world"    // Double quotes
'hello world'    // Single quotes
"line 1\nline 2" // Escape sequences supported
```

### Numbers

```javascript
123       // Integer
45.67     // Decimal
-10       // Negative
1e6       // Scientific notation
```

### Booleans

```javascript
true
false
```

### Null

```javascript
null
```

### Lists (in expressions)

```javascript
["a", "b", "c"]
[1, 2, 3]
```

---

## 11.3 Property Access

### Frontmatter Fields

```javascript
status              // Direct access
priority            // Direct access
author.name         // Nested object
tags[0]             // List index (0-based)
```

### Bracket Notation

For fields with special characters:

```javascript
note["field-with-dashes"]
note["field.with.dots"]
```

### File Metadata

```javascript
file.name           // "task-001.md"
file.path           // "tasks/task-001.md"
file.folder         // "tasks"
file.ext            // "md"
file.size           // 1234 (bytes)
file.ctime          // Created datetime
file.mtime          // Modified datetime
```

### Formulas

```javascript
formula.overdue
formula.urgency_score
```

### Context (this)

```javascript
this.file.name      // Current file's name
this.author         // Current file's author field
```

---

## 11.4 Operators

### Comparison Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `==` | Equal | `status == "open"` |
| `!=` | Not equal | `status != "done"` |
| `>` | Greater than | `priority > 3` |
| `<` | Less than | `priority < 3` |
| `>=` | Greater or equal | `priority >= 3` |
| `<=` | Less or equal | `priority <= 3` |

### Arithmetic Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `+` | Addition | `priority + 1` |
| `-` | Subtraction | `total - discount` |
| `*` | Multiplication | `count * 2` |
| `/` | Division | `total / count` |
| `%` | Modulo | `index % 2` |
| `( )` | Grouping | `(a + b) * c` |

### Boolean Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `&&` | Logical AND | `a && b` |
| `\|\|` | Logical OR | `a \|\| b` |
| `!` | Logical NOT | `!done` |

### Null Coalescing

```javascript
value ?? default    // Returns default if value is null
```

---

## 11.5 String Methods

| Method | Description | Example |
|--------|-------------|---------|
| `.length` | String length | `title.length` |
| `.contains(str)` | Contains substring | `title.contains("bug")` |
| `.startsWith(str)` | Starts with prefix | `title.startsWith("WIP:")` |
| `.endsWith(str)` | Ends with suffix | `file.name.endsWith(".draft.md")` |
| `.toLowerCase()` | Convert to lowercase | `status.toLowerCase()` |
| `.toUpperCase()` | Convert to uppercase | `status.toUpperCase()` |
| `.trim()` | Remove whitespace | `title.trim()` |
| `.slice(start, end)` | Extract substring | `id.slice(0, 4)` |
| `.matches(regex)` | Regex match | `title.matches("^TASK-\\d+")` |

---

## 11.6 List Methods

| Method | Description | Example |
|--------|-------------|---------|
| `.length` | List length | `tags.length` |
| `.contains(value)` | Contains element | `tags.contains("urgent")` |
| `.containsAll(list)` | Contains all elements | `tags.containsAll(["a", "b"])` |
| `.containsAny(list)` | Contains any element | `tags.containsAny(["a", "b"])` |
| `.isEmpty()` | List is empty | `tags.isEmpty()` |
| `.first()` | First element | `tags.first()` |
| `.last()` | Last element | `tags.last()` |
| `[index]` | Element at index | `tags[0]` |
| `.map(expr)` | Transform elements | `tags.map(t => t.toLowerCase())` |
| `.filter(expr)` | Filter elements | `items.filter(i => i.done)` |
| `.sort()` | Sort elements | `tags.sort()` |
| `.flat()` | Flatten nested lists | `nested.flat()` |
| `.join(sep)` | Join to string | `tags.join(", ")` |

---

## 11.7 Date/Time Functions

### Current Date/Time

| Function | Returns | Description |
|----------|---------|-------------|
| `now()` | datetime | Current date and time |
| `today()` | date | Current date (no time) |

### Parsing

| Function | Description | Example |
|----------|-------------|---------|
| `date(string)` | Parse date | `date("2024-03-15")` |
| `datetime(string)` | Parse datetime | `datetime("2024-03-15T10:30:00Z")` |

### Date Components

| Method | Returns | Description |
|--------|---------|-------------|
| `.year` | integer | Year component |
| `.month` | integer | Month (1-12) |
| `.day` | integer | Day of month |
| `.hour` | integer | Hour (0-23) |
| `.minute` | integer | Minute (0-59) |
| `.second` | integer | Second (0-59) |
| `.dayOfWeek` | integer | Day of week (0=Sunday) |
| `.date()` | date | Date portion only |
| `.time()` | time | Time portion only |

### Date Formatting

```javascript
due_date.format("YYYY-MM-DD")
created_at.format("MMM D, YYYY")
```

Common format tokens:
- `YYYY`: 4-digit year
- `MM`: 2-digit month
- `DD`: 2-digit day
- `HH`: 2-digit hour (24h)
- `mm`: 2-digit minute
- `ss`: 2-digit second

---

## 11.8 Date Arithmetic

Dates support arithmetic with duration strings:

```javascript
due_date + "7d"           // Add 7 days
now() - "1w"              // Subtract 1 week
file.mtime > now() - "24h"  // Modified in last 24 hours
```

**Duration units:**

| Unit | Aliases |
|------|---------|
| `y` | `year`, `years` |
| `M` | `month`, `months` |
| `w` | `week`, `weeks` |
| `d` | `day`, `days` |
| `h` | `hour`, `hours` |
| `m` | `minute`, `minutes` |
| `s` | `second`, `seconds` |

**Examples:**

```javascript
today() + "30d"           // 30 days from now
due_date - "2w"           // 2 weeks before due date
created_at + "1y"         // 1 year after creation
```

**Date comparison:**

```javascript
due_date < today()                    // Overdue
due_date < today() + "7d"             // Due within a week
file.mtime > now() - "1h"             // Modified in last hour
```

---

## 11.9 Conditional Expression

```javascript
if(condition, then_value, else_value)
```

**Examples:**

```javascript
if(priority > 3, "high", "normal")
if(status == "done", "✓", "○")
if(due_date < today(), "overdue", if(due_date < today() + "7d", "soon", "ok"))
```

---

## 11.10 Null Handling

### Check Existence

```javascript
exists(field)    // true if field is present and non-null
```

### Provide Default

```javascript
default(field, value)  // Return value if field is null
field ?? value         // Null coalescing operator
```

**Examples:**

```javascript
exists(due_date)                    // Has a due date?
default(priority, 3)                // Default priority to 3
assignee ?? "unassigned"            // Default to "unassigned"
```

---

## 11.11 Type Checking

```javascript
typeof(value)           // Returns type as string
isString(value)
isNumber(value)
isBoolean(value)
isList(value)
isObject(value)
isNull(value)
```

---

## 11.12 Link Functions

| Function | Description | Example |
|----------|-------------|---------|
| `link.asFile()` | Resolve link to file | `parent.asFile().status` |
| `link(path)` | Construct link | `link("tasks/task-001")` |
| `file.hasLink(target)` | File links to target | `file.hasLink(link("api-docs"))` |
| `file.hasTag(tag)` | File has tag | `file.hasTag("important")` |
| `file.inFolder(path)` | File is in folder | `file.inFolder("archive")` |

---

## 11.13 Aggregation Functions (in formulas)

When used in formula context with grouped data:

```javascript
count()                 // Count of items
sum(field)              // Sum of field values
avg(field)              // Average of field values
min(field)              // Minimum value
max(field)              // Maximum value
```

---

## 11.14 Operator Precedence

From highest to lowest:

1. `( )` - Grouping
2. `.` `[]` - Property access
3. `!` `-` (unary) - Negation
4. `*` `/` `%` - Multiplication
5. `+` `-` - Addition
6. `<` `<=` `>` `>=` - Comparison
7. `==` `!=` - Equality
8. `&&` - Logical AND
9. `||` - Logical OR
10. `??` - Null coalescing
11. `=>` - Lambda

Use parentheses to clarify complex expressions.

---

## 11.15 Lambda Expressions

For methods like `map` and `filter`:

```javascript
// Single parameter (implicit)
tags.map(t => t.toLowerCase())

// Multiple parameters
items.map((item, index) => item.name + index)

// With expression body
tasks.filter(t => t.status != "done" && t.priority > 3)
```

---

## 11.16 Expression Examples

### Simple Filters

```javascript
status == "open"
priority >= 4
tags.contains("urgent")
```

### Combined Conditions

```javascript
status == "open" && priority >= 4
status == "blocked" || due_date < today()
!(status == "done")
```

### Date Filters

```javascript
due_date < today()
due_date < today() + "7d"
file.mtime > now() - "24h"
created_at.year == 2024
```

### String Filters

```javascript
title.contains("bug")
title.toLowerCase().contains("urgent")
file.name.startsWith("draft-")
id.matches("^TASK-\\d{4}$")
```

### List Operations

```javascript
tags.length > 0
tags.contains("important")
tags.containsAny(["urgent", "critical"])
assignees.filter(a => a.asFile().team == "eng").length > 0
```

### Computed Fields (Formulas)

```javascript
// Is overdue?
due_date < today() && status != "done"

// Days until due (negative if overdue)
(due_date - today()) / 86400000

// Priority display
if(priority >= 4, "🔴 Critical", if(priority >= 2, "🟡 Normal", "🟢 Low"))

// Urgency score
priority * 10 + if(due_date < today(), 50, 0)
```

### Link Traversal

```javascript
parent.asFile().status == "done"
assignee.asFile().team == "engineering"
blocks.map(b => b.asFile().status).contains("blocked")
```

---

## 11.17 Error Handling

Expression evaluation errors should be handled gracefully:

| Error | Behavior |
|-------|----------|
| Property access on null | Returns null |
| Method call on null | Returns null |
| Division by zero | Returns null or Infinity (implementation-defined) |
| Invalid regex | Evaluation error |
| Type mismatch | Evaluation error or coercion attempt |

Implementations SHOULD log evaluation errors and continue processing where possible.
