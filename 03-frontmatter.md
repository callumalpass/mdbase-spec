---
type: chapter
id: 03-frontmatter
title: "Frontmatter Parsing and Serialization"
description: "YAML frontmatter parsing, null semantics, and write rules"
section: 3
conformance_levels: [1]
test_categories: [config, validation]
depends_on:
  - "[[01-terminology]]"
---

# 3. Frontmatter Parsing and Serialization

This section defines how frontmatter is parsed from files and how it should be written back. Correct handling of YAML edge cases—especially null values and empty fields—is essential for interoperability.

---

## 3.1 Frontmatter Delimiters

A file MAY begin with YAML frontmatter. Frontmatter is delimited by two lines consisting of exactly three hyphens (`---`):

```markdown
---
title: My Document
---

# Heading

Body content begins here.
```

**Rules:**

1. The opening `---` MUST be the very first line of the file (no leading whitespace or blank lines). A UTF-8 BOM, if present, MUST be ignored for this check.

2. The closing `---` MUST be on its own line.

3. The content between the delimiters MUST be valid YAML.

4. If a file does not begin with `---`, it has **no frontmatter**. The entire file is treated as body content, and the record has an empty frontmatter mapping (`{}`).
5. If additional `---` blocks appear later in the file, they are part of the body and are **not** treated as frontmatter.

**Examples of files without frontmatter:**

```markdown
# Just a heading

No frontmatter here.
```

```markdown

---
This is not frontmatter because there's a blank line before the dashes.
---
```

---

## 3.2 YAML Parsing Requirements

### Top-Level Structure

The frontmatter MUST parse as a YAML **mapping** (object/dictionary). 

If the frontmatter parses as a different YAML type (scalar, list, null), implementations MUST treat it as **invalid frontmatter** and handle according to the validation level:

- `off`: Treat as empty frontmatter, log warning
- `warn`: Treat as empty frontmatter, emit warning
- `error`: Fail the operation

**Invalid example:**
```yaml
---
- item1
- item2
---
```

This is a YAML list, not a mapping, and is invalid frontmatter.

### YAML Version

Implementations SHOULD support YAML 1.2. Implementations MAY support YAML 1.1 for compatibility with existing tools, but SHOULD prefer 1.2 semantics where they differ.

### Character Encoding

Files MUST be UTF-8 encoded. Implementations MUST reject files with invalid UTF-8 sequences.

---

## 3.3 Null and Empty Value Semantics

Correct handling of null and empty values is critical for interoperability. This section defines canonical behavior that all implementations MUST follow.

### Reading Null Values

The following YAML patterns MUST all be interpreted as **null**:

```yaml
# Explicit null keyword
field1: null
field2: Null
field3: NULL

# Tilde (YAML null alias)
field4: ~

# Empty value (key with no value)
field5:

# Explicit empty (flow style)
field6:
```

All of the above result in `field` having the value `null`.

### Empty String vs Null

An **empty string** is distinct from **null**:

```yaml
# This is null:
empty_null:

# This is an empty string (not null):
empty_string: ""

# This is also an empty string:
empty_quoted: ''
```

Implementations MUST preserve this distinction. A field with value `""` is a present field with an empty string value. A field with value `null` (or empty) is a present field with no value.

### Missing vs Null

A **missing field** (key not present) is distinct from a **null field** (key present with null value):

```yaml
---
present_null: null
present_string: "hello"
# 'missing_field' is not here
---
```

- `present_null` is **present** with value **null**
- `present_string` is **present** with value **"hello"**  
- `missing_field` is **missing** (not present at all)

This distinction matters for:
- The `exists()` function in expressions (returns `true` when key is present, even if null)
- The `isEmpty()` method (returns `true` when value is null, empty, or missing)
- The `required` constraint (requires present and non-null)
- Default value application (applies to missing, not to null)

### Summary Table

| YAML | Parsed Value | `exists(field)` | Satisfies `required`? (before defaults) |
|------|--------------|-----------------|----------------------------------------|
| `field: null` | null | true | No |
| `field: ~` | null | true | No |
| `field:` | null | true | No |
| `field: ""` | `""` (empty string) | true | Yes (string value) |
| *(key absent)* | undefined | false | No |

### Presence vs Meaningful Value

- `exists(field)` is **true** when the key is present in **raw persisted** frontmatter, even if the value is `null`.
- `field.isEmpty()` is **true** when the value is `null`, empty, or missing.
- `required: true` requires the key to be present in the **effective** frontmatter and the value to be non-null (see [§9.2.1](./09-validation.md#921-required-fields)).

Implementations MUST preserve these distinctions in validation and query evaluation.

---

## 3.4 Writing Frontmatter

When implementations write or update frontmatter, they MUST follow these rules to ensure consistency and avoid ambiguity.

### Never Write Empty-Value Nulls

Implementations MUST NOT write the "empty value" null form:

```yaml
# ❌ NEVER write this
field:
```

This form is ambiguous in some contexts and causes issues with YAML tools that normalize whitespace.

### Writing Null Values

When a field's value is null and the field should be written, implementations MUST use one of:

**Option 1: Explicit null (preferred when preserving the field)**
```yaml
field: null
```

**Option 2: Omit the field entirely (preferred when null means "no value")**
```yaml
# field is simply not present
```

The choice between these options is controlled by `settings.write_nulls`:

| `write_nulls` | Behavior |
|---------------|----------|
| `"omit"` (default) | Omit fields with null values |
| `"explicit"` | Write `field: null` |

### Writing Empty Strings

Empty strings MUST be written with explicit quotes:

```yaml
field: ""
```

### Writing Empty Lists

Empty lists can be written as `[]` or omitted, controlled by `settings.write_empty_lists`:

| `write_empty_lists` | Behavior |
|---------------------|----------|
| `true` (default) | Write `field: []` |
| `false` | Omit fields with empty list values |

---

## 3.5 Formatting Preservation

When updating a file, implementations SHOULD preserve as much of the original formatting as practical. Preservation applies to **untouched** fields and content; fields explicitly modified by the operation MAY be re-serialized using implementation defaults.

### SHOULD Preserve

- **Field order**: Keep fields in their original order when possible
- **Blank lines**: Preserve blank lines within frontmatter (YAML allows them)
- **String style**: If a string was written with quotes, keep the quotes
- **Comment proximity**: Keep comments near their associated fields

### MUST Preserve

- **Body content**: The body MUST NOT be modified by frontmatter updates (except when explicitly changing the body)
- **Line endings**: Preserve the file's line ending style (LF vs CRLF)

### MAY Normalize

Implementations MAY normalize:
- Indentation (2 spaces is conventional)
- Trailing whitespace
- Final newline (files SHOULD end with a newline)

---

## 3.6 Special Characters in Field Names

Field names containing special characters MUST be quoted in YAML:

```yaml
"field-with-dashes": value
"field.with.dots": value
"field:with:colons": value
```

Field names that would otherwise parse as non-strings in YAML (e.g., `yes`, `no`, `null`, `true`, `false`) MUST be quoted to ensure they are treated as strings.

In expressions and queries, such fields are accessed with bracket notation:

```
note["field-with-dashes"]
```

Implementations SHOULD avoid requiring special characters in schema-defined field names. User-defined fields may use them.

---

## 3.7 Multi-line Strings

YAML supports several multi-line string formats. Implementations MUST support all standard YAML multi-line syntaxes:

**Literal block (preserves newlines):**
```yaml
description: |
  This is a multi-line string.
  Line breaks are preserved.
```

**Folded block (newlines become spaces):**
```yaml
description: >
  This is a long line that will be
  folded into a single line.
```

**Quoted strings with escapes:**
```yaml
description: "Line 1\nLine 2"
```

When writing multi-line values, implementations SHOULD use literal block style (`|`) for readability.

---

## 3.8 Type Coercion

YAML has automatic type inference that can cause surprises. Implementations MUST be aware of these patterns:

| YAML Value | YAML Type | Notes |
|------------|-----------|-------|
| `true`, `false` | Boolean | |
| `yes`, `no` | Boolean (YAML 1.1) | Avoid; prefer `true`/`false` |
| `on`, `off` | Boolean (YAML 1.1) | Avoid; prefer `true`/`false` |
| `123` | Integer | |
| `12.5` | Float | |
| `1e10` | Float (scientific) | |
| `0x1A` | Integer (hex) | |
| `.inf`, `-.inf` | Float (infinity) | |
| `.nan` | Float (NaN) | |
| `2024-01-15` | Date (if YAML date extension) | Implementations MAY parse as date |
| `null`, `~` | Null | |
| `"123"` | String | Quoted values are strings |

When schema specifies a type, implementations MUST coerce compatible values (e.g., reading `123` for a string field as `"123"`). When coercion is not possible, it is a validation error.

---

## 3.9 Example: Round-Trip Preservation

Given this input file:

```markdown
---
title: My Task
status: open
tags:
  - important
  - review
due_date: 2024-03-15
notes: |
  This is a longer note.
  It spans multiple lines.
---

# Task Details

The body content here.
```

After updating `status` to `"done"`, the output SHOULD be:

```markdown
---
title: My Task
status: done
tags:
  - important
  - review
due_date: 2024-03-15
notes: |
  This is a longer note.
  It spans multiple lines.
---

# Task Details

The body content here.
```

Note that:
- Field order is preserved
- Multi-line string style is preserved
- List formatting is preserved
- Body content is unchanged
