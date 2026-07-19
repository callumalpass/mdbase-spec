# 16. Conformance

## Profiles

v0.3 conformance is profile-based. Each profile states what behavior an
implementation supports.

| Profile | Purpose |
| --- | --- |
| Core Read | discover collections, parse records, load type files, validate JSON Schema |
| Collection Semantics | matching, read defaults, uniqueness, path policy, collection diagnostics |
| Links | parse, resolve, validate, and traverse links |
| Query | evaluate CEL filters/projections and return query envelopes |
| Core Write | create, update, delete, rename, and batch operations |
| Lifecycle | run standard lifecycle policy for managed fields |
| Runtime Contracts | load contracts, compose effective registries, validate provider/action/event/capability references |
| Workflow | execute workflows by dispatching runtime action handlers |
| Watch | emit file/record/config/type/runtime events after consistent state |

Profiles may depend on earlier profiles. For example, Workflow depends on
Runtime Contracts and enough Core Write/Query support to execute referenced
actions.

Normative profile IDs and dependencies are:

| Profile ID | Requires |
| --- | --- |
| `core_read` | none |
| `collection_semantics` | `core_read` |
| `cel_query` | `core_read` |
| `links` | `collection_semantics`, `cel_query` |
| `core_write` | `collection_semantics` |
| `lifecycle` | `core_write`, `cel_query` |
| `runtime_contracts/0.1` | `core_read` |
| `workflow/0.1` | `runtime_contracts/0.1`, `cel_query` and runtime-specific action profiles |
| `watch` | `core_read` |

Profiles are atomic claims. An implementation MUST pass every required behavior
and test for a profile before claiming that profile. Partial behavior can be
listed as an optional feature, but MUST NOT be presented as profile conformance.

### Conformance Claim Documents

Conformance claims MUST validate against
`schemas/v0.3/conformance-claim.schema.json`. A claim names:

- the exact implementation and implementation version
- the exact mdbase specification version
- every supported profile ID, including required dependency profiles
- the runtime profile version when a runtime profile is claimed
- the supported JSON Schema keywords and formats
- operational limits that can affect portable behavior
- evidence commands and the time and environment in which they passed

Claims such as "v0.3 compatible" without a validated profile list are
incomplete. A product role also does not imply a profile: an LSP, CLI, plugin,
or server claims only the profiles it actually verifies.

`v0_2_read` and `v0_2_migrate` are compatibility declarations, not v0.3
profiles. They describe transition behavior and do not weaken any claimed v0.3
profile.

The canonical claim schema enforces profile dependency declarations. Release
automation SHOULD reject claims whose evidence is missing, stale, or produced
against a different implementation artifact.

## Canonical Diagnostics

Every diagnostic contains:

```yaml
severity: error
code: type_conflict
message: Human-readable context
path: tasks/example.md
field: status
type: task
schema_location: "https://mdbase.dev/schemas/v0.3/type-file.schema.json#/..."
details: {}
```

`severity`, `code`, and `message` are required. Paths use collection-relative
forward-slash form. `field` uses JSON Pointer or an explicitly identified
frontmatter selector. Implementations MAY add fields under `x-*`.

The v0.3 core codes introduced by this revision include
`unsupported_profile`, `type_conflict`, `type_membership_changed`,
`path_value_missing`, `schema_ref_forbidden`, `schema_ref_unresolved`,
`schema_ref_cycle`, `format_invalid`, `lifecycle_expression_error`, and
`concurrent_modification`. Runtime profile 0.1 additionally defines
`contract_conflict`, `contract_version_mismatch`, `event_provider_mismatch`,
`provider_version_mismatch`, `capability_denied`, `policy_not_selected`,
`executor_not_selected`, and `idempotency_unavailable`.

## Core Read Requirements

Core Read implementations MUST:

- identify a collection by `mdbase.yaml`
- scan records with forward slash paths
- load v0.3 type files
- validate embedded JSON Schema against the v0.3 profile
- match records by explicit type declarations and basic match rules
- validate raw frontmatter against matched schemas
- report diagnostics in a machine-readable shape

## Collection Semantics Requirements

Collection Semantics implementations MUST:

- apply `collection.read_defaults` to effective reads only
- validate `collection.unique`
- validate simple `collection.path` policies for write-capable tools
- expose display metadata without treating it as validation
- validate all matched types instead of merging constraints

## Links Requirements

Links implementations MUST:

- parse wikilinks, Markdown links, and bare path link values
- resolve collection-relative and file-relative paths safely
- enforce `collection.links.target_type`
- enforce `validate_exists`
- expose `file.links`, `file.embeds`, and `file.tags`
- support bounded `asFile()` traversal in expressions

## Query Requirements

Query implementations MUST:

- evaluate where filters using the mdbase CEL profile
- support type filtering
- support deterministic ordering and pagination
- return result metadata including total count and has-more
- distinguish raw and effective frontmatter when requested

## Core Write Requirements

Core Write implementations MUST:

- validate before writing
- preserve unrelated body content where possible
- reject path traversal
- detect common concurrency conflicts
- emit diagnostics rather than silently overwriting invalid state

## Lifecycle Requirements

Lifecycle implementations MUST:

- support `on_create` and `on_update`
- support standard providers for `now`, `today`, `uuid`, `ulid`, `slugify`,
  `copy`, and `literal`
- run lifecycle before final validation
- report conflicts between matched type lifecycle policies

## Runtime Contracts Requirements

Runtime Contracts implementations MUST:

- load provider, action, event, capability, policy, and workflow contract records
- represent implicit runtime contracts when provided by a runtime
- compose the effective registry deterministically
- reject unknown contract record keys unless they use an `x-*` extension name
- validate embedded action and event JSON Schemas
- validate event envelopes and payloads
- validate action input and output values against contract schemas
- resolve workflow `trigger.event`, `step.action`, capabilities, and providers
- reject duplicate trigger or step IDs within a workflow
- resolve provider contract listings, runtime-policy workflow selectors, and
  runtime-policy capability selectors
- fail preflight when runtime policy denies a required capability
- fail preflight when a `single_executor` workflow has no selected executor
- treat capability records as optional catalog entries rather than required
  materializations of every effective capability
- support materialization of implicit contracts when claiming materialization
  support

This profile does not require workflow execution.

## Workflow Requirements

Workflow implementations MUST:

- evaluate trigger conditions
- evaluate step conditions and input templates
- validate evaluated inputs before dispatch
- respect `run.execution.mode`
- respect runtime-policy executor selection for `single_executor` workflows
- derive and use idempotency keys when declared
- enforce run policy limits
- record step result envelopes
- validate action outputs and emitted events
- provide clear diagnostics for unsupported actions and capabilities

Workflow conformance does not require claims, leases, leader election, or a
shared scheduler. Those are optional stronger coordination mechanisms.

The actual action handler set is runtime-specific and MUST be declared through
the effective registry.

## Test Suite Direction

The v0.3 conformance suite should be rebuilt around:

- JSON Schema fixtures
- type wrapper fixtures
- collection semantic fixtures
- CEL host binding fixtures
- lifecycle operation fixtures
- runtime contract registry fixtures
- workflow preflight fixtures
- optional execution fixtures for known local runtimes

v0.2.x tests remain useful for behavior that survives v0.3, especially
frontmatter parsing, missing/null semantics, links, CRUD safety, and watch
ordering. Tests tied to the custom field grammar should be migrated rather than
preserved as-is.

## Parallel Test Suite

The initial v0.3 suite lives under `tests/v0.3/` and is intentionally parallel to
the existing `tests/level-*` v0.2.x suite.

The first six suite files cover:

- `schema_artifacts`: canonical JSON Schemas, type files, runtime records, and
  sample event envelopes
- `migration`: v0.2 generated type files to v0.3 wrappers and reports
- `core_collection`: type wrappers, JSON Schema validation, matching, read
  defaults, links, uniqueness, and path policy
- `lifecycle`: `on_create`/`on_update` managed fields, guards, and conflicts
- `cel`: mdbase CEL host bindings and missing/null behavior
- `runtime_contracts`: provider/action/event/capability registry composition,
  workflow preflight, event/action validation, implicit contracts, and
  materialization

`scripts/check_v03_tests.py` validates the v0.3 suite structure and executes the
artifact-level tests that can run without a full v0.3 implementation. Adapter
tests remain in the same YAML files and become executable as v0.3 implementations
add the corresponding operations.

Artifact checks alone are not a release gate. Promotion to a stable spec
requires at least one adapter to pass every required core profile test and a
second independent implementation to pass `core_read`,
`collection_semantics`, and shared schema/CEL fixtures.

The artifact runner also executes the prototype TaskNotes type migration checks
for the fixture under `examples/v0.3/tasknotes-migration`. Runtime execution,
core CRUD, lifecycle behavior, and CEL evaluation still require adapter/runtime
implementations unless a local prototype package explicitly covers the case.
