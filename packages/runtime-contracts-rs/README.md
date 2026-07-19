# mdbase-runtime-contracts-rs

Prototype Rust validation harness for the mdbase v0.3 runtime contract layer.

This crate intentionally mirrors only the shared-understanding layer:

- parse Markdown frontmatter records
- load canonical schemas from `schemas/v0.3`
- validate `_types/*.md` and runtime contract records
- validate embedded action/event JSON Schemas by compiling them
- count explicit provider, action, event, capability, workflow, and policy
  records

It is not a workflow engine and does not dispatch action handlers.

## Local Verification

```bash
cargo test --manifest-path packages/runtime-contracts-rs/Cargo.toml
```
