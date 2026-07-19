# 11. Querying

## Query Object

A query selects records from a collection.

```yaml
types: [task]
where: 'status != "done" && priority >= 3'
order_by:
  - field: due
    direction: asc
limit: 20
offset: 0
include_body: false
```

## Types

`types` is an OR filter. A record is included if it matches at least one listed
type.

If `types` is omitted, all records are candidates.

## Where

`where` is a CEL expression evaluated against the effective record. The
expression result is truthy only when it evaluates to boolean true.

Evaluation errors MUST produce null for that record and report diagnostics
according to query options.

## Projections

Queries MAY request projections:

```yaml
select:
  - title
  - file.path
  - name: is_overdue
    expr: 'present.record.due && due < today() && status != "done"'
```

Projection expressions use CEL.

Computed projection values belong to the query result. Persistence requires an
explicit write operation.

## Ordering

`order_by` sorts by one or more fields or projection names.

```yaml
order_by:
  - field: due
    direction: asc
  - field: priority
    direction: desc
```

Null values sort last in ascending order and first in descending order.

When all ordering fields compare equal, tools MUST tie-break by ascending
`file.path` for deterministic results.

## Pagination

`limit` and `offset` apply after filtering and sorting.

`limit: 0` returns an empty result page. Total count metadata still describes
the complete match set.

## Body Search

`file.body` MAY be used in filters even when `include_body` is false. In that
case the body is available for filtering but not returned in results.

Tools MAY report that body filtering requires a profile or index when they
cannot read bodies on demand.

## Result Envelope

Query results MUST use this envelope:

```yaml
results:
  - file:
      path: tasks/fix-login.md
    frontmatter:
      title: Fix login
      status: open
meta:
  total_count: 1
  has_more: false
diagnostics: []
```

Each result MUST include `file.path`. `meta.total_count` is the count before
pagination, and `meta.has_more` is true when additional matching records remain.
Diagnostics use the canonical diagnostic envelope from the conformance chapter.

`frontmatter` contains effective values unless the query asks for raw persisted
frontmatter.

Read defaults are included in effective frontmatter. Projections are included
only when requested.

## Embedded Queries

Embedded query contexts may bind `this` to the containing record.

Tools that support embedded queries MUST define how `this` is supplied and how
collection-relative links resolve from the embedding file.
