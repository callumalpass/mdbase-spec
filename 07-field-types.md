# 7. Field Types and Constraints

This section defines the data types that can be used in type definitions, along with their constraints and validation rules.

---

## 7.1 Field Definition Structure

Every field in a type's `fields` section has this structure:

```yaml
fields:
  field_name:
    # Required: the data type
    type: string
    
    # Optional: is this field required?
    required: false
    
    # Optional: default value if field is missing
    default: "untitled"
    
    # Optional: auto-generation strategy
    generated: now
    
    # Optional: human-readable description
    description: "A brief summary"
    
    # Optional: mark as deprecated
    deprecated: false
    
    # Type-specific constraints (see each type below)
```

---

## 7.2 Common Field Options

These options apply to all field types:

### `type` (Required)

The data type. One of: `string`, `integer`, `number`, `boolean`, `date`, `datetime`, `time`, `enum`, `list`, `object`, `link`, `any`.

### `required`

Whether the field must be present and non-null.

| Value | Behavior |
|-------|----------|
| `false` (default) | Field may be missing or null |
| `true` | Field must be present and non-null |

### `default`

A default value applied when the field is missing. The default is NOT applied when the field is present but null.

```yaml
status:
  type: enum
  values: [open, done]
  default: open  # Applied only if 'status' key is absent
```

### `generated`

Automatic value generation. See [7.12 Generated Fields](#712-generated-fields).

### `description`

Human-readable description of the field's purpose. Implementations MAY display this in tooling.

### `deprecated`

Mark a field as deprecated. Implementations SHOULD warn when deprecated fields are used.

---

## 7.3 `string`

A text value.

```yaml
title:
  type: string
  required: true
  min_length: 1
  max_length: 200
  pattern: "^[A-Z].*"
```

**Constraints:**

| Constraint | Type | Description |
|------------|------|-------------|
| `min_length` | integer | Minimum string length |
| `max_length` | integer | Maximum string length |
| `pattern` | string | Regex pattern the value must match |

**Validation:**
- Value must be a string (or coercible to string)
- Length constraints apply to character count (not bytes)
- Pattern uses ECMAScript (ES2018+) regular expression syntax as the required baseline (see [§4.8](./04-configuration.md#48-security-considerations) for the full regex specification)

---

## 7.4 `integer`

A whole number.

```yaml
priority:
  type: integer
  min: 1
  max: 5
  default: 3
```

**Constraints:**

| Constraint | Type | Description |
|------------|------|-------------|
| `min` | integer | Minimum value (inclusive) |
| `max` | integer | Maximum value (inclusive) |

**Validation:**
- Value must be a whole number (no decimal part)
- YAML integers, strings containing integers, and floats with no decimal part MAY be coerced

---

## 7.5 `number`

A floating-point number.

```yaml
rating:
  type: number
  min: 0.0
  max: 5.0
```

**Constraints:**

| Constraint | Type | Description |
|------------|------|-------------|
| `min` | number | Minimum value (inclusive) |
| `max` | number | Maximum value (inclusive) |

**Validation:**
- Value must be numeric (integer or float)
- IEEE 754 special values (NaN, Infinity) are allowed unless explicitly constrained

---

## 7.6 `boolean`

A true/false value.

```yaml
draft:
  type: boolean
  default: false
```

**Validation:**
- Accepts YAML boolean values: `true`, `false`
- Implementations SHOULD also accept YAML 1.1 boolean spellings: `yes`, `no`, `on`, `off`
- These should be normalized to `true`/`false` on write

---

## 7.7 `date`

A calendar date without time.

```yaml
due_date:
  type: date
```

**Format:** ISO 8601 date: `YYYY-MM-DD`

**Examples:** `2024-03-15`, `2024-12-01`

**Validation:**
- Must be a valid date (no February 30th)
- String format must match ISO 8601
- YAML date scalars MAY be accepted and MUST be normalized to ISO 8601 on write

---

## 7.8 `datetime`

A date with time.

```yaml
created_at:
  type: datetime
```

**Format:** ISO 8601 datetime with optional timezone:
- `YYYY-MM-DDTHH:MM:SS`
- `YYYY-MM-DDTHH:MM:SSZ`
- `YYYY-MM-DDTHH:MM:SS+HH:MM`

**Examples:**
- `2024-03-15T10:30:00`
- `2024-03-15T10:30:00Z`
- `2024-03-15T10:30:00+05:30`

**Validation:**
- Must be valid datetime
- Implementations MUST preserve timezone information if present
- YAML timestamp scalars MAY be accepted and MUST be normalized to ISO 8601 on write

---

## 7.9 `time`

A time without date.

```yaml
meeting_time:
  type: time
```

**Format:** `HH:MM` or `HH:MM:SS`

**Examples:** `14:30`, `09:00:00`

---

## 7.10 `enum`

A value from a fixed set of options.

```yaml
status:
  type: enum
  values: [draft, review, published, archived]
  default: draft
```

**Required constraint:**

| Constraint | Type | Description |
|------------|------|-------------|
| `values` | list | The allowed values (must be strings) |

**Validation:**
- Value must exactly match one of the `values` entries
- Comparison is case-sensitive
- Enum values MUST be strings

---

## 7.11 `list`

An ordered collection of values.

```yaml
tags:
  type: list
  items:
    type: string
  min_items: 0
  max_items: 10
  unique: true
```

**Required constraint:**

| Constraint | Type | Description |
|------------|------|-------------|
| `items` | field definition | The type of each list element |

**Optional constraints:**

| Constraint | Type | Description |
|------------|------|-------------|
| `min_items` | integer | Minimum list length |
| `max_items` | integer | Maximum list length |
| `unique` | boolean | If true, no duplicate values allowed |

**Validation:**
- Value must be a YAML list
- Each element is validated against `items`
- If `unique: true`, duplicates cause validation failure

**Nested lists:**
```yaml
matrix:
  type: list
  items:
    type: list
    items:
      type: number
```

---

## 7.12 `object`

A nested structure with its own fields.

```yaml
author:
  type: object
  fields:
    name:
      type: string
      required: true
    email:
      type: string
    url:
      type: string
```

**Required constraint:**

| Constraint | Type | Description |
|------------|------|-------------|
| `fields` | mapping | Field definitions for the nested object |

**Validation:**
- Value must be a YAML mapping
- Each field is validated according to its definition
- Unknown fields are handled according to type's strictness

---

## 7.13 `link`

A reference to another file in the collection.

```yaml
parent_task:
  type: link
  target: task
  validate_exists: false

related:
  type: list
  items:
    type: link
```

**Optional constraints:**

| Constraint | Type | Description |
|------------|------|-------------|
| `target` | string | Type name to constrain resolution scope |
| `validate_exists` | boolean | If true, validate that target file exists |

**Accepted formats:**
- Wikilinks: `[[target]]`, `[[target|alias]]`, `[[folder/target]]`
- Markdown links: `[text](path.md)`, `[text](./relative.md)`
- Bare paths: `./sibling.md`, `../parent/file.md`

See [Links](./08-links.md) for detailed parsing and resolution rules.

---

## 7.14 `any`

Accepts any valid YAML value.

```yaml
metadata:
  type: any
```

**Use cases:**
- Migration: Temporarily accept untyped data
- Flexible schemas: When structure varies
- Extension points: Allow arbitrary user data

**Validation:**
- Any valid YAML value is accepted
- No constraints available

---

## 7.15 Generated Fields

Fields can be automatically populated using the `generated` option:

```yaml
fields:
  id:
    type: string
    generated: ulid
  
  created_at:
    type: datetime
    generated: now
  
  updated_at:
    type: datetime
    generated: now_on_write
  
  slug:
    type: string
    generated:
      from: title
      transform: slugify
```

**Generation strategies:**

| Strategy | Description |
|----------|-------------|
| `ulid` | Generate a ULID (Universally Unique Lexicographically Sortable Identifier) |
| `uuid` | Generate a UUID v4 |
| `now` | Current datetime (on create only) |
| `now_on_write` | Current datetime (on every write) |
| `{from, transform}` | Derive from another field |

**Transform functions for derived fields:**

| Transform | Description |
|-----------|-------------|
| `slugify` | Convert to URL-safe slug |
| `lowercase` | Convert to lowercase |
| `uppercase` | Convert to uppercase |

**Important rules:**

1. Generated values are only applied when the field is **missing**
2. User-provided values are NEVER overwritten by `now` or `ulid`/`uuid`
3. `now_on_write` ALWAYS updates the field on every write operation
4. Generated fields can still have `required: true` (they'll satisfy the requirement via generation)

---

## 7.16 Type Coercion

When reading values, implementations MUST attempt to coerce compatible types:

| Schema Type | Accepts |
|-------------|---------|
| `string` | Any scalar (converted via toString) |
| `integer` | Integer, float with no decimal, numeric string |
| `number` | Integer, float, numeric string |
| `boolean` | Boolean, "true"/"false" strings, yes/no |
| `date` | ISO date string, YAML date |
| `datetime` | ISO datetime string, YAML timestamp |

When coercion fails, it is a validation error.

---

## 7.17 Summary Table

| Type | YAML | Constraints | Notes |
|------|------|-------------|-------|
| `string` | String | `min_length`, `max_length`, `pattern` | |
| `integer` | Integer | `min`, `max` | Whole numbers only |
| `number` | Float/Int | `min`, `max` | Allows decimals |
| `boolean` | Boolean | — | Normalized to true/false |
| `date` | String | — | ISO 8601 date |
| `datetime` | String | — | ISO 8601 datetime |
| `time` | String | — | HH:MM or HH:MM:SS |
| `enum` | String | `values` (required) | Must match exactly |
| `list` | List | `items` (required), `min_items`, `max_items`, `unique` | |
| `object` | Mapping | `fields` (required) | Nested structure |
| `link` | String | `target`, `validate_exists` | Reference to file |
| `any` | Any | — | No validation |
