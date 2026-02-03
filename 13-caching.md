---
type: chapter
id: 13-caching
title: "Caching and Indexing"
description: "Optional caching, staleness detection, and index invalidation"
section: 13
conformance_levels: [6]
test_categories: [caching]
depends_on:
  - "[[12-operations]]"
---

# 13. Caching and Indexing

Caching and indexing are optional features that accelerate queries on large collections. This section defines cache behavior and requirements.

---

## 13.1 Core Principle

**Files are the source of truth.**

Caches are derived data. They MUST be:
- Rebuildable from files alone
- Deletable without data loss
- Optional for correctness (only affect performance)

If you delete the cache folder, the collection still works—queries just run slower.

---

## 13.2 When Caching Helps

Caching significantly improves performance for:

| Operation | Without Cache | With Cache |
|-----------|---------------|------------|
| Query by type | Scan all files | Index lookup |
| Query by field | Scan all files | Index lookup |
| Path prefix filter | Filesystem scan | Index lookup |
| Link resolution | Search all files | Direct lookup |
| Backlink queries | Scan all files | Reverse index |
| Full-text body search | Read all files | Text index |

For small collections (< 100 files), caching overhead may not be worthwhile. For large collections (1000+ files), caching is strongly recommended.

---

## 13.3 Cache Requirements

If an implementation supports caching, it MUST follow these rules:

### 13.3.1 Derivable

The cache MUST be completely rebuildable from:
- Collection files (markdown)
- Configuration (mdbase.yaml)
- Type definitions

No information should exist only in the cache.

### 13.3.2 Optional

All operations MUST work without the cache, possibly slower:
- Queries scan files directly
- Backlinks are computed on demand
- Link resolution searches the collection

### 13.3.3 Detectable Staleness

The implementation MUST detect when the cache is stale:
- File modified after cache entry
- File deleted but still in cache
- New file not in cache
- Config changed since cache build

### 13.3.4 Explicit Rebuild

Users MUST be able to force a full cache rebuild:

```bash
mdbase cache rebuild
```

### 13.3.5 Deletable

Deleting the cache folder MUST NOT affect:
- File contents
- Collection integrity
- Operation correctness

---

## 13.4 Cache Location

The default cache location is `.mdbase/` at the collection root, configurable via `settings.cache_folder`.

```
my-collection/
├── mdbase.yaml
├── _types/
├── tasks/
├── notes/
└── .mdbase/                  # Cache folder
    ├── index.sqlite        # Main index (example)
    ├── links.json          # Link graph (example)
    └── meta.json           # Cache metadata
```

### Gitignore

The cache folder SHOULD be gitignored. Add to `.gitignore`:

```
.mdbase/
```

Cache files are machine-specific and should not be version controlled.

---

## 13.5 What to Cache

Implementations MAY cache:

| Data | Purpose |
|------|---------|
| File metadata | Fast file lookups |
| Parsed frontmatter | Avoid re-parsing |
| Type assignments | Fast type queries |
| Field values | Field-based queries |
| Link graph | Link resolution, backlinks |
| Full-text index | Body content search |

### Minimum Recommended

At minimum, caching implementations SHOULD index:
- File paths and mtimes (for staleness detection)
- Type assignments (for type queries)
- Link relationships (for backlinks)

---

## 13.6 Cache Invalidation

### Staleness Detection

For each file, track:
- Last known mtime
- Content hash (optional, more reliable)

On query:
1. Check if file mtime matches cached mtime
2. If different, mark entry stale
3. Re-parse file and update cache

### Change Triggers

Cache entries should be invalidated when:

| Change | Invalidation |
|--------|--------------|
| File modified | Re-index that file |
| File created | Index new file |
| File deleted | Remove from index |
| File renamed | Update path, check links |
| Config changed | Full rebuild |
| Type definition changed | Re-index affected files |

### Incremental vs Full Rebuild

**Incremental**: Update only changed entries (fast, normal operation)

**Full rebuild**: Recreate entire cache (slow, guaranteed consistent)

Implementations SHOULD support both.

---

## 13.7 Backlinks and Caching

The `file.backlinks` property requires knowing which files link TO a given file. This requires a reverse link index.

### Building the Backlink Index

For each file A in the collection:
1. Parse A's frontmatter and body
2. Extract all links from A
3. For each link target B:
   - Add A to B's backlinks set

### Storage

```json
{
  "tasks/task-001.md": {
    "backlinks": [
      "tasks/parent.md",
      "notes/meeting.md"
    ]
  }
}
```

### Performance Note

Without caching, computing backlinks requires scanning every file. For large collections, this is prohibitively slow. Implementations SHOULD:

1. Document that `file.backlinks` requires caching for good performance
2. Warn when backlink queries are slow
3. Suggest enabling caching

---

## 13.8 Cache Commands

Implementations SHOULD provide cache management commands:

```bash
# Show cache status
mdbase cache status
# Output: Cache valid, 1234 files indexed, last built 5 min ago

# Rebuild entire cache
mdbase cache rebuild

# Clear cache
mdbase cache clear

# Update cache incrementally
mdbase cache update

# Verify cache integrity
mdbase cache verify
```

---

## 13.9 Cache Implementation Options

Implementations may use various storage backends:

### SQLite (Recommended)

```
.mdbase/index.sqlite
```

Pros: ACID, queryable, single file, widely supported
Cons: Binary file (not human-readable)

### JSON Files

```
.mdbase/files.json
.mdbase/links.json
.mdbase/types.json
```

Pros: Human-readable, simple
Cons: Full rewrite on update, no concurrent access

### Memory Only

No persistent cache; rebuild on each run.

Pros: No disk I/O, always fresh
Cons: Slow startup for large collections

---

## 13.10 Concurrent Access

When multiple processes may access the collection:

### Read-Only Access

Multiple readers can safely share a cache. Use file locking or SQLite's WAL mode.

### Write Access

When one process writes:
1. Acquire exclusive lock
2. Perform operation
3. Update cache
4. Release lock

Implementations SHOULD document concurrency behavior.

---

## 13.11 Cache Warming

For large collections, initial cache build can take time. Implementations MAY support:

**Eager warming**: Build cache on first access
```bash
mdbase cache build
```

**Lazy warming**: Build entries on first query for each file

**Background warming**: Build cache asynchronously while serving queries

---

## 13.12 Cache Versioning

Cache format may change between implementation versions. Include a version marker:

```json
{
  "version": "1.0",
  "spec_version": "0.2.0",
  "built_at": "2024-03-15T10:30:00Z"
}
```

When loading cache:
1. Check version compatibility
2. If incompatible, trigger full rebuild
3. Log version mismatch for debugging
