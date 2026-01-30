# 11. Expression Language

Expressions are strings that evaluate to values. They are used in query filters, match conditions, and computed formulas. This section defines the expression syntax and available functions.

---

## 11.1 Expression Context

Expressions are evaluated in a context that provides:

- **Frontmatter fields**: Direct access via bare names (effective values: defaults applied, computed excluded)
- **Raw frontmatter**: Via the `note.` namespace (equivalent to `file.properties`)
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
file.body           // Raw markdown body content (string)
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
| `.length` | String length (field) | `title.length` |
| `.contains(str)` | Contains substring | `title.contains("bug")` |
| `.containsAll(...strs)` | Contains all substrings | `title.containsAll("bug", "fix")` |
| `.containsAny(...strs)` | Contains any substring | `title.containsAny("bug", "fix")` |
| `.startsWith(str)` | Starts with prefix | `title.startsWith("WIP:")` |
| `.endsWith(str)` | Ends with suffix | `file.name.endsWith(".draft.md")` |
| `.isEmpty()` | Empty or absent | `title.isEmpty()` |
| `.lower()` | Convert to lowercase | `status.lower()` |
| `.upper()` | Convert to uppercase | `status.upper()` |
| `.title()` | Title case | `name.title()` |
| `.trim()` | Remove whitespace | `title.trim()` |
| `.slice(start, end?)` | Extract substring | `id.slice(0, 4)` |
| `.split(sep, n?)` | Split to list | `tags_str.split(",")` |
| `.replace(pattern, repl)` | Replace pattern | `title.replace("old", "new")` |
| `.repeat(count)` | Repeat string | `"-".repeat(3)` |
| `.reverse()` | Reverse string | `name.reverse()` |
| `.matches(regex)` | Regex match (see [§4.8](./04-configuration.md#48-security-considerations) for regex flavor) | `title.matches("^TASK-\\d+")` |

---

## 11.6 List Methods

| Method | Description | Example |
|--------|-------------|---------|
| `.length` | List length (field) | `tags.length` |
| `.contains(value)` | Contains element | `tags.contains("urgent")` |
| `.containsAll(...values)` | Contains all elements | `tags.containsAll("a", "b")` |
| `.containsAny(...values)` | Contains any element | `tags.containsAny("a", "b")` |
| `.isEmpty()` | List is empty | `tags.isEmpty()` |
| `[index]` | Element at index | `tags[0]` |
| `.filter(expr)` | Filter elements | `items.filter(value > 2)` |
| `.map(expr)` | Transform elements | `tags.map(value.lower())` |
| `.reduce(expr, init)` | Reduce to single value | `nums.reduce(acc + value, 0)` |
| `.flat()` | Flatten nested lists | `nested.flat()` |
| `.reverse()` | Reverse element order | `items.reverse()` |
| `.slice(start, end?)` | Extract portion | `items.slice(0, 3)` |
| `.sort()` | Sort ascending | `tags.sort()` |
| `.unique()` | Remove duplicates | `tags.unique()` |
| `.join(sep)` | Join to string | `tags.join(", ")` |

In `filter()`, `map()`, and `reduce()`, the implicit variables `value` and `index` refer to the current element and its position. For `reduce()`, `acc` is the accumulator.

`containsAll()` and `containsAny()` are variadic; passing a list literal counts as a single value and does not auto-expand.

---

## 11.7 Date/Time Functions

### Current Date/Time

| Function | Returns | Description |
|----------|---------|-------------|
| `now()` | datetime | Current date and time |
| `today()` | date | Current date (no time) |

**Timezone semantics:**
- `now()` and `today()` use the implementation's local timezone unless otherwise configured.
- Date-only values (`date` type) are interpreted in the local timezone for comparisons.
- Datetime values with explicit offsets MUST be compared in absolute time.

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

**Duration string format:**

Each duration string contains a single number-unit pair. Whitespace between the number and unit is allowed (`"7d"` and `"7 days"` are equivalent). Compound durations in a single string (e.g., `"1d12h"`) are NOT supported — chain additions instead:

```javascript
date + "1M" + "4h" + "3m"  // Add 1 month, 4 hours, 3 minutes
```

**Calendar arithmetic:** Adding months or years clamps to the last day of the target month. For example, `date("2024-01-31") + "1M"` returns `2024-02-29` (2024 is a leap year), not `2024-03-02`.

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

**Date subtraction:**

Subtracting two dates returns the difference in **milliseconds**:

```javascript
now() - file.ctime                    // Milliseconds since creation
(today() - due_date) / 86400000       // Days overdue (negative if not yet due)
(now() + "1d") - now()                // Returns 86400000
```

**Duration function:**

The `duration()` function explicitly parses a duration string. This is needed when performing arithmetic on durations themselves:

```javascript
now() + (duration("1d") * 2)          // 2 days from now
duration("5h") * 3                    // Duration must be on the left
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
exists(field)    // true if field key is present (including null values)
field.isEmpty()  // true if field is null, empty, or absent
```

**Note:** `exists()` checks for key presence in **raw persisted** frontmatter. A field with value `null` exists but is empty. Use `isEmpty()` to check if a field has a meaningful value.

### Provide Default

```javascript
default(field, value)  // Return value if field is null or missing
field ?? value         // Null coalescing operator
```

**Examples:**

```javascript
exists(due_date)                    // Has a due date?
default(priority, 3)                // Default priority to 3
assignee ?? "unassigned"            // Default to "unassigned"

**Missing vs null:** In expressions, missing properties are treated like `null` for `default()` and `??`. Use `exists(field)` to distinguish missing from present-null.
```

---

## 11.11 Type Checking and Conversion

### Type Checking

```javascript
value.isType("string")     // true if value is a string
value.isType("number")     // true if value is a number
value.isType("boolean")    // true if value is a boolean
value.isType("date")       // true if value is a date
value.isType("list")       // true if value is a list
value.isType("object")     // true if value is an object
```

### Type Conversion

```javascript
value.toString()           // Convert any value to string
number("3.14")             // Parse string to number
number(true)               // Returns 1 (false returns 0)
number(date_value)         // Milliseconds since epoch
value.isTruthy()           // Coerce to boolean
list(value)                // Wrap in list if not already a list
```

---

## 11.12 Link Functions

| Function | Description | Example |
|----------|-------------|---------|
| `link.asFile()` | Resolve link to file | `parent.asFile().status` |
| `link(path)` | Construct link | `link("tasks/task-001")` |
| `file.hasLink(target)` | File links to target | `file.hasLink(link("api-docs"))` |
| `file.hasTag(...tags)` | File has any of the given tags; uses prefix matching for nested tags (see [§8](./08-links.md)) | `file.hasTag("important")` |
| `file.hasProperty(name)` | Raw persisted frontmatter has the key | `file.hasProperty("status")` |
| `file.inFolder(path)` | File is in folder (or subfolder) | `file.inFolder("archive")` |
| `file.asLink(display?)` | Convert file to link | `file.asLink("display text")` |

---

## 11.13 Object Methods

| Method | Description | Example |
|--------|-------------|---------|
| `.isEmpty()` | Has no properties | `metadata.isEmpty()` |
| `.keys()` | List of property names | `metadata.keys()` |
| `.values()` | List of property values | `metadata.values()` |

---

## 11.14 Summary Functions

Summary functions operate on a collection of values across all matching records. They are used in the `summaries` section of a query (see [Querying](./10-querying.md)).

In summary formulas, the `values` keyword represents all values for a given property across the result set. The formula MUST return a single value.

**Summary value semantics:**

- `values` is ordered to match the query result order (or group order when grouped).
- Missing properties contribute `null` values to `values`.
- Custom summaries receive `values` with `null` entries intact.
- Built-in summaries SHOULD ignore `null`/empty values unless the function is explicitly about emptiness (e.g., `Empty`, `Filled`).

```javascript
values.reduce(acc + value, 0)         // Sum
values.reduce(acc + value, 0) / values.length  // Average
values.filter(value.isTruthy()).length // Count of truthy values
```

### Default Summary Functions

Implementations SHOULD provide these built-in summary functions:

| Name | Input Type | Description |
|------|-----------|-------------|
| `Average` | Number | Mean of all numeric values |
| `Min` | Number | Smallest number |
| `Max` | Number | Largest number |
| `Sum` | Number | Sum of all numbers |
| `Range` | Number | Difference between Max and Min |
| `Median` | Number | Median value |
| `Earliest` | Date | Earliest date |
| `Latest` | Date | Latest date |
| `Checked` | Boolean | Count of `true` values |
| `Unchecked` | Boolean | Count of `false` values |
| `Empty` | Any | Count of empty/null values |
| `Filled` | Any | Count of non-empty values |
| `Unique` | Any | Count of unique values |

---

## 11.15 Operator Precedence

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

Use parentheses to clarify complex expressions.

---

## 11.16 Lambda Expressions

List methods like `filter()`, `map()`, and `reduce()` use implicit variables rather than arrow function syntax:

```javascript
// value refers to the current element, index to its position
items.filter(value > 2)
tags.map(value.lower())
items.map(value.toString() + " (" + index.toString() + ")")

// reduce also provides acc (accumulator)
numbers.reduce(acc + value, 0)
```

Implementations MAY also support arrow function syntax as an extension:

```javascript
tags.map(t => t.lower())
tasks.filter(t => t.status != "done")
```

If arrow functions are supported, implementations SHOULD parse them only within
function argument positions and treat `=>` as part of the lambda expression itself
(not as a general-purpose operator).

---

## 11.17 Expression Examples

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
title.lower().contains("urgent")
file.name.startsWith("draft-")
id.matches("^TASK-\\d{4}$")
```

### List Operations

```javascript
tags.length > 0
tags.contains("important")
tags.containsAny("urgent", "critical")
assignees.filter(a => a.asFile().team == "eng").length > 0
```

### Computed Fields (Formulas)

```javascript
// Is overdue?
due_date < today() && status != "done"

// Days overdue (date subtraction returns milliseconds)
(today() - due_date) / 86400000

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

## 11.18 Error Handling

Expression evaluation errors MUST be handled gracefully and MUST NOT abort the overall query:

| Error | Behavior |
|-------|----------|
| Property access on null | Returns null |
| Method call on null | Returns null |
| Division by zero | Returns null and emits `type_error` |
| Invalid regex | Evaluation error (see [§4.8](./04-configuration.md#48-security-considerations) for regex flavor) |
| Type mismatch | Returns null and emits `type_error` |

Implementations SHOULD log evaluation errors and continue processing where possible.

---

## 11.19 Expression Portability

Expressions using only spec-defined functions and operators are **portable expressions**. This section defines rules for maintaining portability across implementations.

### Custom Functions

Implementations MAY define custom functions beyond those specified in this document. Custom functions MUST be namespaced with the `ext` prefix using either `::` or `.` as a delimiter:

```javascript
ext::myFunc(value)    // Double-colon delimiter
ext.myFunc(value)     // Dot delimiter
```

Both delimiter forms are equivalent. Implementations MUST accept either form for custom functions they define.

### Rules

1. **Namespace requirement**: Implementations MUST namespace all custom functions with the `ext` prefix. Unprefixed custom functions are not permitted.

2. **No shadowing**: Implementations MUST NOT override or shadow built-in functions or operators defined in this specification.

3. **Non-portable warnings**: Implementations SHOULD emit a warning when evaluating an expression that uses non-portable functions (i.e., `ext`-prefixed functions).

4. **Documentation**: Type definitions and queries SHOULD note when they depend on non-portable expressions.

### Example

```yaml
# Portable expression — uses only spec-defined functions
filters: 'status == "open" && due_date < today()'

# Non-portable expression — uses a custom function
filters: 'ext::sentiment(title) > 0.5'
```

Implementations encountering an unknown `ext`-prefixed function MUST treat it as an evaluation error (see [§11.18](#1118-error-handling)).
