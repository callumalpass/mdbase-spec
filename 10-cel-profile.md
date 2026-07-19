# 10. CEL Profile

## Portable Expression Language

Portable v0.3 expressions use CEL.

Stored v0.3 files SHOULD NOT use Obsidian Bases expressions, JavaScript, Python,
SQL fragments, or implementation-specific expression languages unless the
containing feature explicitly declares a non-portable extension namespace.

Obsidian-facing tools MAY accept Bases formulas in their UI and translate them
to CEL before writing portable mdbase files.

## Expression Locations

CEL expressions appear in:

- query `where`
- query projections
- collection projections, if supported
- lifecycle guards
- workflow trigger conditions
- workflow step conditions
- workflow step input templates
- runtime policy predicates

`match.where` is not CEL in v0.3 core.

## Host Bindings

The mdbase CEL profile defines these bindings where relevant:

| Binding | Meaning |
| --- | --- |
| frontmatter field names | effective record values in query context |
| `record` | effective frontmatter object |
| `raw` | persisted frontmatter object |
| `present` | boolean presence maps for record fields |
| `file` | file metadata and link/tag helpers |
| `note` | alias for the current record value where useful for compatibility |
| `this` | current embedding record for embedded query contexts |
| `old` | previous raw frontmatter during update lifecycle and record-change events |
| `event` | runtime event envelope |
| `steps` | prior workflow step results |
| `vars` | workflow variables |
| `item` | current item in workflow iteration |

Bindings by expression location are normative:

| Location | Bindings |
| --- | --- |
| query, projection, `match.expr` | top-level effective fields, `record`, `raw`, `present`, `file`, `note`; optional `this` only for embedded queries |
| lifecycle guard | top-level draft fields, `record`, `raw`, `present`, `old`, `file`, `operation` |
| workflow trigger | `event`, `vars` |
| workflow step condition/input | `event`, `steps`, `vars`, and `item` during iteration |
| runtime policy predicate | `event`, `workflow`, `action`, `actor`, `runtime` |

An unavailable binding is a compile/preflight diagnostic, not a null value.

System bindings (`file`, `raw`, `record`, `note`, `present`, `this`, `event`,
`steps`, `vars`, and `item`) are reserved at the top level. If frontmatter uses
one of those names, tools MUST expose the frontmatter value through
`record.<field>` and `raw.<field>` rather than allowing it to replace the system
binding.

## Null And Missing

The profile must preserve the mdbase distinction between missing and null.

Rules:

- top-level field names evaluate against effective record values for ergonomic
  expressions such as `status == "open"`
- `record` contains effective frontmatter after read defaults
- `raw` contains only persisted frontmatter
- `present.raw.<field>` is true when the field exists in persisted
  frontmatter, even when its value is null
- `present.record.<field>` is true when the field exists in the effective
  record, including values supplied by `collection.read_defaults`
- implementations SHOULD materialize `present.*` entries for all schema-known
  fields, persisted fields, and defaulted fields so missing fields evaluate to
  boolean false rather than a host-engine field error
- property access through null returns null rather than aborting the whole query
- type errors in query filters evaluate to null, and null is treated as false
  for filtering

Bare `has(status)` is not portable v0.3 CEL. `has(raw.status)` is also
insufficient for mdbase record presence because CEL engines can treat null map
values as not present. The portable record-presence contract is the `present`
binding.

## Date And Duration

The profile defines host functions:

- `now()`
- `today()`
- `duration(string)`

Date, timestamp, time, and duration values MUST have stable comparison and
serialization rules. Timestamp comparisons are by instant. Date comparisons are
calendar-date comparisons.

`now()` returns an RFC 3339 UTC date-time. `today()` returns the calendar date in
the runtime's declared timezone. Runtimes MUST declare that timezone in
operation/runtime context; silently using a machine-local timezone is not
portable. `duration(string)` accepts ISO 8601 durations only in portable files.

## File And Link Helpers

The profile defines:

- `link(value)`
- `file.hasTag(tag)`
- `file.hasLink(linkValue)`
- `file.inFolder(path)`
- `file.asLink()`
- `linkValue.asFile()`

`asFile()` returns null for broken links and MUST enforce a traversal depth
limit to prevent unbounded graph walks.

## Cost Limits

Tools SHOULD enforce:

- maximum expression length
- maximum AST depth
- maximum link traversal depth
- maximum list iteration count
- timeout or evaluation budget for user-authored expressions

Exceeded limits produce diagnostics rather than partial silent results.

## Diagnostics

Expression diagnostics SHOULD include:

- expression source
- line and column or byte range when available
- code
- message
- host binding or function name when relevant

Runtime tools SHOULD distinguish parse/type errors from evaluation errors.

All stored expressions MUST compile during type, query, workflow, or policy
preflight. Compile and type errors invalidate the containing object. During
evaluation:

- a query evaluation error yields null for that record and emits a diagnostic
- a lifecycle evaluation error fails the operation
- a workflow trigger or step evaluation error fails the run or step; it is not
  treated as an ordinary false condition
- a normally evaluated false or null condition does not match

Implementations MUST bound expression size, AST depth, evaluation work, and
link traversal. The portable minimum limits are 64 KiB source text, AST depth
100, and link traversal depth 10. Tools MAY enforce lower operational time or
memory budgets only when they report the limit in diagnostics.
