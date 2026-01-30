# 4. Configuration

This section defines the structure and semantics of the `mdbase.yaml` configuration file that identifies and configures a collection.

---

## 4.0 File Encoding

The `mdbase.yaml` configuration file and all type definition files MUST be encoded in UTF-8 (consistent with the UTF-8 requirement for markdown files in [§3.2](./03-frontmatter.md)).

---

## 4.1 File Location and Format

The configuration file MUST be named `mdbase.yaml` and MUST be located at the collection root. This file:

- Identifies the directory as a collection
- Specifies the schema version
- Configures collection behavior
- Points to the types folder

The file MUST be valid YAML and MUST parse as a mapping at the top level.

---

## 4.2 Minimal Configuration

The simplest valid configuration declares only the specification version:

```yaml
spec_version: "0.1.0"
```

This creates a collection with all default settings and no types (all files are untyped).

---

## 4.3 Full Configuration Schema

```yaml
# =============================================================================
# REQUIRED
# =============================================================================

# Specification version this configuration conforms to
# Implementations MUST reject versions they do not support
spec_version: "0.1.0"

# =============================================================================
# OPTIONAL: Collection Metadata
# =============================================================================

# Human-readable name for the collection
name: "My Project Tasks"

# Description of the collection's purpose
description: "Task and note management for the My Project initiative"

# =============================================================================
# OPTIONAL: Settings
# =============================================================================

settings:
  # ---------------------------------------------------------------------------
  # File Discovery
  # ---------------------------------------------------------------------------
  
  # Additional file extensions to treat as markdown (beyond .md which is always included)
  # Default: []
  # Common additions: ["mdx", "markdown"]
  # Entries MAY include a leading dot; implementations MUST normalize to no-dot.
  extensions: ["mdx"]
  
  # Paths to exclude from scanning (relative to collection root)
  # Default: [".git", "node_modules", ".mdbase"]
  # Glob patterns are supported
  exclude:
    - ".git"
    - "node_modules"
    - ".mdbase"
    - "drafts/**"
    - "*.draft.md"
  
  # Whether to scan subdirectories recursively
  # Default: true
  include_subfolders: true
  
  # ---------------------------------------------------------------------------
  # Types Configuration
  # ---------------------------------------------------------------------------
  
  # Folder containing type definition files (relative to collection root)
  # Default: "_types"
  types_folder: "_types"
  
  # Frontmatter keys that explicitly declare a file's type(s)
  # If a file has any of these keys, its value determines the type(s)
  # Default: ["type", "types"]
  explicit_type_keys: ["type", "types"]
  
  # ---------------------------------------------------------------------------
  # Validation
  # ---------------------------------------------------------------------------
  
  # Default validation level for operations
  # "off": No validation
  # "warn": Report issues but don't fail
  # "error": Report issues and fail operations
  # Default: "warn"
  default_validation: "warn"
  
  # Default strictness for types that don't specify their own
  # false: Extra fields allowed
  # true: Extra fields cause validation failure
  # "warn": Extra fields allowed but emit warning
  # Default: false
  default_strict: false
  
  # ---------------------------------------------------------------------------
  # Link Resolution
  # ---------------------------------------------------------------------------
  
  # Field name used as unique identifier for link resolution
  # When a link is a simple name (no path), implementations search for files
  # where this field matches the link target
  # Default: "id"
  id_field: "id"
  
  # ---------------------------------------------------------------------------
  # Write Behavior
  # ---------------------------------------------------------------------------
  
  # How to handle null values when writing frontmatter
  # "omit": Don't write fields with null values
  # "explicit": Write as `field: null`
  # Default: "omit"
  write_nulls: "omit"
  
  # Whether to write empty lists
  # true: Write as `field: []`
  # false: Omit fields with empty list values
  # Default: true
  write_empty_lists: true
  
  # ---------------------------------------------------------------------------
  # Rename Behavior
  # ---------------------------------------------------------------------------
  
  # Whether to update references across the collection when a file is renamed
  # Default: true
  rename_update_refs: true
  
  # ---------------------------------------------------------------------------
  # Caching
  # ---------------------------------------------------------------------------
  
  # Folder for cache files (relative to collection root)
  # Default: ".mdbase"
  cache_folder: ".mdbase"
```

---

## 4.4 Setting Details

### `spec_version` (Required)

The version of this specification the configuration conforms to. Implementations MUST check this value and MUST reject configuration files with versions they do not support.

**Valid values:** `"0.1.0"`

**Compatibility:** Implementations MAY accept `"0.1"` as an alias for `"0.1.0"`, but
SHOULD emit a warning and normalize to `"0.1.0"` when writing.

### `name` and `description`

Human-readable metadata about the collection. These have no semantic effect but are useful for documentation and tooling that displays collection information.

### `settings.extensions`

File extensions to scan. The extension `.md` is always implicitly included. This setting specifies **additional** extensions beyond `.md`:

**Default:** `[]`

**Normalization:**
- Implementations MUST treat entries with or without a leading dot as equivalent.
- The `.md` extension is always implicitly included and MUST NOT be required in this list.
- If `md` or `.md` appears in `extensions`, it SHOULD be ignored with a warning.

**Example:** To include MDX files:
```yaml
settings:
  extensions: ["mdx"]
```

### `settings.exclude`

Paths or glob patterns to exclude from file scanning. Paths are relative to the collection root.

**Default:** `[".git", "node_modules", ".mdbase"]`

**Glob patterns:**
- `*` matches any characters except `/`
- `**` matches any characters including `/`
- `?` matches a single character

**Example:**
```yaml
settings:
  exclude:
    - ".git"
    - "node_modules"
    - "*.draft.md"      # Exclude all draft files
    - "archive/**"      # Exclude everything in archive/
```

### `settings.types_folder`

The folder containing type definition files. Type files are markdown files whose frontmatter defines a schema.

**Default:** `"_types"`

The types folder:
- Is automatically excluded from the regular file scan
- Is scanned separately to load type definitions
- May contain subdirectories (all `.md` files are processed)

### `settings.explicit_type_keys`

Frontmatter keys that can explicitly declare a file's type(s). When a file has one of these keys, its value determines the type assignment, overriding any match rules.

**Default:** `["type", "types"]`

**Usage:**
```yaml
# Single type
type: task

# Multiple types
types: [task, urgent]
```

### `settings.default_validation`

The default validation level applied when not otherwise specified.

| Value | Behavior |
|-------|----------|
| `"off"` | No validation performed |
| `"warn"` | Validation issues are reported but operations succeed |
| `"error"` | Validation issues cause operations to fail |

**Default:** `"warn"`

### `settings.default_strict`

Default strictness mode for types that don't declare their own.

| Value | Behavior |
|-------|----------|
| `false` | Unknown fields are allowed |
| `"warn"` | Unknown fields are allowed but trigger warnings |
| `true` | Unknown fields cause validation failure |

**Default:** `false`

### `settings.id_field`

The field name used as a unique identifier for link resolution. When a link is a simple name (not a path), implementations search for files where this field matches.

**Uniqueness requirement:** Values of the `id_field` MUST be unique across the collection.
Implementations MUST validate uniqueness and report `duplicate_id` issues when multiple
files share the same `id_field` value.

**Default:** `"id"`

**Example:** With `id_field: "id"`, the link `[[task-001]]` would resolve to a file with `id: task-001` in its frontmatter.

### `settings.write_nulls`

Controls how null values are written to frontmatter.

| Value | Behavior |
|-------|----------|
| `"omit"` | Fields with null values are not written |
| `"explicit"` | Null values are written as `field: null` |

**Default:** `"omit"`

### `settings.rename_update_refs`

Whether renaming a file automatically updates references to it across the collection.

**Default:** `true`

When enabled, implementations MUST update:
- Link fields in frontmatter that resolve to the renamed file
- Link syntax in body content that references the renamed file

See [Operations](./12-operations.md) for details.

---

## 4.5 Configuration Validation

Implementations MUST validate the configuration file before processing the collection. Validation checks:

1. **Structure:** The file parses as valid YAML with a mapping at the top level
2. **Required fields:** `spec_version` is present
3. **Type correctness:** Each field has the expected type
4. **Valid values:** Enum fields have allowed values
5. **Path validity:** Paths in `exclude`, `types_folder`, etc. are syntactically valid

If validation fails, implementations MUST NOT process the collection and MUST report the error clearly.

---

## 4.6 Configuration Examples

### Minimal

```yaml
spec_version: "0.1.0"
```

### Standard Project

```yaml
spec_version: "0.1.0"
name: "Project Documentation"
description: "Specs, decisions, and meeting notes"

settings:
  exclude:
    - ".git"
    - "node_modules"
    - "drafts/**"
  default_validation: "error"
```

### Knowledge Base with Custom Types Folder

```yaml
spec_version: "0.1.0"
name: "Personal Knowledge Base"

settings:
  types_folder: "schemas"
  extensions: ["mdx"]
  default_strict: "warn"
  id_field: "uid"
```

### Strict Validation

```yaml
spec_version: "0.1.0"
name: "Production Data"

settings:
  default_validation: "error"
  default_strict: true
  write_nulls: "explicit"
```

---

## 4.7 Environment Variables (Optional)

Implementations MAY support environment variable substitution in configuration values using `${VAR}` syntax:

```yaml
settings:
  cache_folder: "${MDBASE_CACHE:-/tmp/mdbase}"
```

This feature is OPTIONAL. If not supported, implementations MUST treat `${...}` as literal strings.

---

## 4.8 Security Considerations

### Regular Expressions

Match rules, field constraints (`pattern`), and expressions (the `matches` operator) may contain regular expressions.

**Required baseline:** Implementations MUST support **ECMAScript (ES2018+)** regular expression syntax as the baseline flavor. This aligns with JavaScript-based tools (e.g., Obsidian) and is available in every major programming language.

**Required features (MUST support):**

| Feature | Syntax | Example |
|---------|--------|---------|
| Character classes | `[abc]`, `[^abc]`, `\d`, `\w`, `\s` | `\d{4}` |
| Quantifiers | `*`, `+`, `?`, `{n}`, `{n,m}` | `\w+` |
| Alternation | `\|` | `cat\|dog` |
| Anchors | `^`, `$` | `^TASK-` |
| Capturing groups | `(...)` | `(\d+)-(\d+)` |
| Non-capturing groups | `(?:...)` | `(?:foo\|bar)` |
| Lookahead | `(?=...)`, `(?!...)` | `\d+(?= items)` |

**Optional features (SHOULD support):**

| Feature | Syntax | Notes |
|---------|--------|-------|
| Lookbehind | `(?<=...)`, `(?<!...)` | Supported in ES2018 but not in RE2-based engines |
| Named groups | `(?<name>...)` | Supported in ES2018 but not in RE2-based engines |

Implementations that do not support optional features MUST reject patterns using those features with a clear error rather than silently ignoring them.

**ReDoS mitigations:** Implementations SHOULD guard against [Regular Expression Denial of Service (ReDoS)](https://owasp.org/www-community/attacks/Regular_expression_Denial_of_Service_-_ReDoS) by:

- Setting timeouts on regex evaluation
- Rejecting patterns with known dangerous constructs (e.g., nested quantifiers)
- Documenting any regex restrictions

### Environment Variables

If an implementation supports environment variable expansion in configuration (e.g., `${VAR}`), it MUST:

- Only expand variables explicitly referenced in configuration
- Never log expanded values that may contain secrets
- Document which config fields support expansion

### Expression Evaluation

Implementations SHOULD set resource limits on expression evaluation:

- Maximum expression nesting depth
- Maximum number of function calls per evaluation
- Timeout for individual expression evaluations

These limits prevent pathological expressions from consuming unbounded resources.
