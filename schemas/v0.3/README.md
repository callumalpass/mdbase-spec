# mdbase v0.3 Schemas

Draft canonical JSON Schemas for the side-by-side v0.3 rewrite.

These schemas validate frontmatter payloads and runtime envelopes. They are not
yet published package artifacts.

## Files

| Schema | Purpose |
| --- | --- |
| `type-file.schema.json` | frontmatter of `_types/*.md` v0.3 type files |
| `conformance-claim.schema.json` | machine-readable implementation profile claims and evidence |
| `runtime/provider.schema.json` | provider contract records |
| `runtime/workflow.schema.json` | workflow records |
| `runtime/action.schema.json` | action contract records |
| `runtime/event.schema.json` | event contract records |
| `runtime/capability.schema.json` | capability contract records |
| `runtime/runtime-policy.schema.json` | runtime policy records |
| `runtime/run.schema.json` | materialized run records |
| `runtime/checkpoint.schema.json` | materialized checkpoint records |
| `runtime/diagnostic.schema.json` | materialized runtime diagnostic records |
| `runtime/event-envelope.schema.json` | delivered runtime event envelopes |

The schemas are intentionally self-contained. Runtime contract record schemas
are strict about known fields and accept local/provider metadata through `x-*`
extension keys. Later package generation can factor common `$defs` into shared
files if that helps TypeScript/Rust codegen.
