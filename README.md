# mdbase specification

mdbase defines a portable way to treat a folder of Markdown files with YAML
frontmatter as a typed, queryable collection.

The current collection protocol is **v0.3.0**. Implementations may still be
distributed as prerelease packages while they complete platform qualification;
package version and protocol version are intentionally independent.

**Read the published site:** [mdbase.dev](https://mdbase.dev)

## Design

> JSON Schema validates persisted frontmatter shape. mdbase defines the
> Markdown collection behavior around that shape. CEL is the portable
> expression language. Runtime behavior is declared through typed Markdown
> contracts and executed by conforming runtimes.

The specification covers collection boundaries, record parsing, JSON Schema
type wrappers, matching and defaults, links, lifecycle behavior, CEL queries,
CRUD operations, runtime providers, workflows, migration, and conformance.

## Specification

| Section | File | Purpose |
| --- | --- | --- |
| 00 | [Overview](./00-overview.md) | scope, profiles, and design split |
| 01 | [Concepts](./01-concepts.md) | terminology and data model |
| 02 | [Collection Layout](./02-collection-layout.md) | discovery, paths, and reserved state |
| 03 | [Records And Frontmatter](./03-records-and-frontmatter.md) | Markdown and YAML value semantics |
| 04 | [Configuration](./04-configuration.md) | `mdbase.yaml` v0.3 configuration |
| 05 | [Type Files](./05-type-files.md) | JSON Schema wrappers and type metadata |
| 06 | [JSON Schema Profile](./06-json-schema-profile.md) | supported 2020-12 vocabulary and `$ref` rules |
| 07 | [Collection Semantics](./07-collection-semantics.md) | matching, defaults, uniqueness, links, and paths |
| 08 | [Links](./08-links.md) | link values, parsing, and resolution |
| 09 | [Lifecycle](./09-lifecycle.md) | managed values and mutation-time policy |
| 10 | [CEL Profile](./10-cel-profile.md) | portable expressions and host bindings |
| 11 | [Querying](./11-querying.md) | filters, ordering, and result envelopes |
| 12 | [Operations](./12-operations.md) | read/write behavior and diagnostics |
| 13 | [Runtime Contracts](./13-runtime-contracts.md) | providers, actions, events, capabilities, and policy |
| 14 | [Workflows](./14-workflows.md) | workflow records and execution semantics |
| 15 | [Migrations And Compatibility](./15-migrations-and-compatibility.md) | safe v0.2 migration and compatibility |
| 16 | [Conformance](./16-conformance.md) | profiles, claims, fixtures, and runners |

The complete v0.2.1 specification and its implementer material remain available
in the [v0.2 archive](./v0.2/README.md). Legacy `tests/level-*` fixtures remain in
place for compatibility runners and are labeled in [tests/README.md](./tests/README.md).

## Artifacts

- `schemas/v0.3/` contains the canonical JSON Schemas.
- `tests/v0.3/` contains shared v0.3 conformance fixtures.
- `examples/v0.3/` contains runtime and migration proof collections.
- `packages/runtime-contracts/` contains the browser-safe TypeScript runtime
  contract package and explicit Node loader export.
- `packages/runtime-contracts-rs/` validates the same contracts in Rust.
- `release/v0.3.0.md` is the auditable ecosystem release contract.

## Verification

```bash
python3 scripts/check_v03_tests.py
python3 scripts/prototype_tasknotes_v03_migration.py --check-fixture
npm test --prefix packages/runtime-contracts
cargo test --manifest-path packages/runtime-contracts-rs/Cargo.toml
npm test --prefix packages/cel-host
npm test --prefix packages/runtime-executor
npm run build --prefix site
```

## Implementations

| Project | Language | Role |
| --- | --- | --- |
| [mdbase](https://github.com/callumalpass/mdbase) | TypeScript | collection implementation and migration engine |
| [mdbase-rs](https://github.com/callumalpass/mdbase-rs) | Rust | independent collection implementation |
| [mdbase-cli](https://github.com/callumalpass/mdbase-cli) | TypeScript | command-line operations and reviewed migration |
| [mdbase-lsp](https://github.com/callumalpass/mdbase-lsp) | Rust | editor diagnostics from Rust semantics |
| [mdbase-obsidian](https://github.com/callumalpass/mdbase-obsidian) | TypeScript | Obsidian collection and runtime host adapter |

## License

MIT
