# 4. Configuration

This section defines the structure and semantics of the `mdbase.yaml` configuration file that identifies and configures a collection.

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
spec_version: "0.1"
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
spec_version: "0.1"

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
  
  # File extensions to treat as markdown (in addition to .md)
  # Default: ["md"]
  # Common additions: ["mdx", "markdown"]
  extensions: ["md", "mdx"]
  
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

**Valid values:** `"0.1"`

### `name` and `description`

Human-readable metadata about the collection. These have no semantic effect but are useful for documentation and tooling that displays collection information.

### `settings.extensions`

Additional file extensions to treat as markdown files. The extension `.md` is always included; this setting adds to it.

**Default:** `["md"]`

**Example:** To include MDX files:
```yaml
settings:
  extensions: ["md", "mdx"]
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
spec_version: "0.1"
```

### Standard Project

```yaml
spec_version: "0.1"
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
spec_version: "0.1"
name: "Personal Knowledge Base"

settings:
  types_folder: "schemas"
  extensions: ["md", "mdx"]
  default_strict: "warn"
  id_field: "uid"
```

### Strict Validation

```yaml
spec_version: "0.1"
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
