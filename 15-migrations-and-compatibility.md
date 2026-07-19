# 15. Migrations And Compatibility

## Migration Philosophy

v0.3 is a source-level revision. It should not preserve every v0.2.x feature by
adding compatibility magic to the new core.

Migration tooling should produce:

- a readable diff
- a machine-readable report
- explicit unsupported-feature notes
- generated output only with user approval or generated-file detection

Migration is collection-wide analysis, not only type-file rewriting. Before a
write, tooling MUST validate every existing record against the proposed target
types and include incompatible records in the report.

## Type Mapping

| v0.2.x feature | v0.3 destination |
| --- | --- |
| `fields` | JSON Schema `properties` |
| field `required` | JSON Schema root `required` |
| `type: string` | `{ type: "string" }` |
| `type: integer` | `{ type: "integer" }` |
| `type: number` | `{ type: "number" }` |
| `type: boolean` | `{ type: "boolean" }` |
| `type: date` | `{ type: "string", format: "date" }` |
| `type: datetime` | `{ type: "string", format: "date-time" }` |
| `type: time` | `{ type: "string", format: "time" }` |
| `type: enum`, `values` | JSON Schema `enum` |
| `type: list` | JSON Schema `array` |
| `type: object` | JSON Schema `object` |
| `type: link` | JSON Schema string/array plus `collection.links` |
| `default` | JSON Schema `default` and/or `collection.read_defaults` |
| `strict` | `additionalProperties` |
| `unique` | `collection.unique` |
| `generated` | `lifecycle` |
| `computed` | query projection, collection projection, or workflow |
| `path_pattern` | `collection.path.pattern` |
| `display_name_key` | `collection.display.name_field` |
| `extends` | JSON Schema `$ref`/`allOf` or explicit duplication |

## Defaults

Migration should distinguish:

- creation/editor hints: JSON Schema `default`
- effective read/query defaults: `collection.read_defaults`
- dynamic values: `lifecycle`

For current mdbase field defaults, the safest migration is to emit both JSON
Schema `default` and `collection.read_defaults` for static scalar defaults, with
a report explaining the difference.

## Generated Fields

Generated fields migrate to lifecycle:

| v0.2.x generated | v0.3 lifecycle |
| --- | --- |
| `now` | `on_create.set.field: { now: true }` |
| `now_on_write` | `on_update.set.field: { now: true }` |
| `uuid` | `{ uuid: true }` |
| `ulid` | `{ ulid: true }` |
| `slugify from field` | `{ slugify: field }` |

## Computed Fields

Computed fields do not migrate to JSON Schema.

Migration should emit one of:

- query projection suggestion
- `collection.projections` when the target tool supports it
- workflow/runtime policy when the computed value should be materialized
- unsupported note when the computation has side effects or depends on
  non-portable functions

## Expressions

Current mdbase expressions migrate to CEL where possible.

Obsidian Bases expressions should be treated as an adapter concern. Obsidian
tools may translate Bases formulas to CEL for portable storage and translate
back for UI/export where possible.

## Runtime Workflows

Current generated-field and tool-conforming behavior that causes mutation
should be reviewed as lifecycle or workflow behavior.

Generated IDs and timestamps usually become lifecycle.

Cross-record behavior, agent work, approval flows, external APIs, and scheduled
checks become workflows and action/event contracts.

## Domain Annotations

Application-specific field annotations migrate to namespaced sections.

Example:

```yaml
x-tasknotes:
  fields:
    status:
      role: status
      completed_values: [done, cancelled]
```

They SHOULD NOT become JSON Schema custom keywords in portable v0.3 files.

## Version Detection

A v0.2.x type file usually has `name` and `fields` without `kind:
mdbase.type`.

A v0.3 type file has `kind: mdbase.type` and `schema`.

Migration tooling SHOULD refuse ambiguous files unless the user supplies an
explicit source version.

## Safe Migration Protocol

A conforming migration command has separate analyze and apply phases:

1. discover source config, type files, extension metadata, and records
2. generate proposed config/types without modifying the collection
3. validate generated schemas and type files
4. validate all existing records against the proposed target
5. emit a human-readable diff and machine-readable report
6. require explicit approval unless every target is recognized as generated
7. create a backup manifest containing hashes and original paths
8. write through temporary files and atomic renames where supported
9. re-open and validate the migrated collection

Apply MUST abort before writes when analysis has unsupported features or invalid
target records unless the caller explicitly selects a documented partial mode.
A failed apply restores files from the backup manifest when restoration is
possible and reports any paths requiring manual recovery.

Apply SHOULD durably journal the currently attempted path and completed paths
inside the backup before each replacement. Tooling MUST provide a recovery path
that can resume or restore an interrupted apply. Restoration MUST validate the
backup hashes from the manifest before replacing current files and MUST require
explicit approval when invoked as a separate command.

Repeated analysis of unchanged inputs MUST produce the same report. Re-applying
an already migrated type is rejected rather than rewriting it again.

Unknown source metadata is preserved under `x-legacy-v0.2` with its original
key paths unless a named migration adapter handles it. YAML comments and style
preservation are best effort, but Markdown bodies MUST be preserved byte for
byte.

The report includes source and target hashes, generated-file evidence, exact
mappings, warnings, unsupported constructs, invalid record paths, proposed file
operations, backup location, and post-apply validation status.

## Downstream Strategy

Recommended migration order:

1. promoted `mdbase-spec` prose, schemas, fixtures, and examples
2. shared schemas and runtime contract helper packages
3. TypeScript and Rust core readers
4. CLI validation and migration dry-run
5. LSP schema/workflow diagnostics
6. TaskNotes generated export
7. TaskNotes workflow/runtime projects
8. Canvas Bases runtime workflow integration
9. Pickle and other mdbase-backed apps

Generated type files should migrate before user-authored vault files.
