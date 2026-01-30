# 15. Watching

This section defines the watch mode event model for monitoring a collection for changes. Watch mode is a required capability for Level 6 conformance.

---

## 15.1 Overview

Watch mode enables implementations to monitor a collection for filesystem changes and emit structured events. This supports real-time UIs, continuous validation, and incremental cache updates.

---

## 15.2 Event Types

| Event | Trigger | Payload Fields |
|-------|---------|----------------|
| `file_created` | New markdown file detected | `path`, `types`, `frontmatter` |
| `file_modified` | Existing file content changed | `path`, `types`, `frontmatter`, `changed_fields` |
| `file_deleted` | Markdown file removed | `path`, `last_known_types` |
| `file_renamed` | File moved/renamed (if detectable) | `from`, `to`, `types` |
| `type_changed` | Type definition file modified | `type_name`, `affected_files` |
| `config_changed` | `mdbase.yaml` modified | `previous_hash`, `new_hash` |
| `validation_error` | File fails validation after change | `path`, `issues` |

When present, `frontmatter` in events is the **effective** frontmatter (defaults applied, computed excluded).

---

## 15.3 Event Payload Structure

All events include a common set of fields:

| Field | Type | Description |
|-------|------|-------------|
| `event` | string | Event type (e.g., `file_created`) |
| `timestamp` | datetime | When the event was emitted |
| `path` | string | File path relative to collection root |

Additional fields per event type are listed in §15.2.

### Example Payloads

**`file_created`:**
```yaml
event: file_created
timestamp: "2024-03-15T10:30:00Z"
path: "tasks/task-042.md"
types: [task]
frontmatter:  # Effective frontmatter (defaults applied, computed excluded)
  title: "New task"
  status: open
```

**`file_modified`:**
```yaml
event: file_modified
timestamp: "2024-03-15T10:31:00Z"
path: "tasks/task-042.md"
types: [task]
frontmatter:  # Effective frontmatter (defaults applied, computed excluded)
  title: "New task"
  status: in_progress
changed_fields: [status]  # Raw persisted frontmatter keys that changed
```

**`file_deleted`:**
```yaml
event: file_deleted
timestamp: "2024-03-15T10:32:00Z"
path: "tasks/task-042.md"
last_known_types: [task]
```

**`file_renamed`:**
```yaml
event: file_renamed
timestamp: "2024-03-15T10:33:00Z"
from: "tasks/task-042.md"
to: "archive/task-042.md"
types: [task]
```

---

## 15.4 Debouncing

Implementations MUST debounce filesystem events — multiple rapid changes to the same file MUST be coalesced into a single event.

- Recommended debounce window: 100–500ms (implementation-defined)
- After the debounce window, the implementation reads the file's current state and emits one event reflecting the net change
- If a file is created and then immediately deleted within the debounce window, no event is emitted

---

## 15.5 Rename Detection

Filesystem watchers typically see a delete followed by a create rather than a rename.

- Implementations SHOULD detect renames by correlating a delete and create within a short window (e.g., same content hash, or same `id_field` value)
- If rename detection succeeds, emit a single `file_renamed` event
- If rename detection fails, implementations MUST emit separate `file_deleted` and `file_created` events

---

## 15.6 Event Delivery

- Implementations MUST support callback/listener registration for events
- Events MUST be delivered in order per file — events for the same file are delivered sequentially. Events for different files MAY be delivered concurrently
- If event processing (in a listener callback) fails, the error MUST NOT stop the watcher. Implementations SHOULD log the error and continue

---

## 15.7 Interaction with Caching

When a cache is present (see [§13](./13-caching.md)):

- Watch events SHOULD trigger incremental cache updates
- Cache updates MUST complete before the event is delivered to listeners, so that listeners see consistent state when they query the collection
