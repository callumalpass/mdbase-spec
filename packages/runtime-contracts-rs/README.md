# mdbase-runtime-contracts-rs

Prototype Rust validation harness for the mdbase v0.3 runtime contract layer.

This crate is a v0.3.0 ecosystem release artifact. It exercises the same
canonical schemas and example collections as the TypeScript runtime package so
the shared contract model is validated from an independent language. Rust
conformance remains defined by the profiles in
[16-conformance.md](../../16-conformance.md).

This crate intentionally mirrors only the shared-understanding layer:

- parse Markdown frontmatter records
- load canonical schemas from `schemas/v0.3`
- load the shared v0.3 runtime example collection
- validate `_types/*.md` and runtime contract records
- validate embedded action/event JSON Schemas by compiling them
- count explicit provider, action, event, capability, workflow, and policy
  records

It is not a workflow engine and does not dispatch action handlers.

## Local Verification

```bash
cargo test --manifest-path packages/runtime-contracts-rs/Cargo.toml
```
