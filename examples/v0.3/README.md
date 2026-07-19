# v0.3 Examples

Example collections for the v0.3 side-folder rewrite.

## `canvas-runtime/`

A small proof collection showing:

- a v0.3 `task` type backed by embedded JSON Schema
- runtime system type files backed by `schemas/v0.3/runtime/*.schema.json`
- provider records for `mdbase` and `canvas-bases`
- an explicit `canvas.drop` event contract
- an explicit `mdbase.record.patch` action contract
- a workflow that turns a canvas drop into a record patch

The example is not meant to be executed by the current v0.2.x tooling. It is a
shape proof for the v0.3 schema/runtime contract.

## `tasknotes-migration/`

A migration fixture for TaskNotes' generated mdbase export. It includes a
representative current v0.2 type file, the proposed v0.3 output, and a
machine-readable migration report.

## `pickle-migration/`

A collection-wide fixture based on Pickle's built-in request and response
types. It exercises multiple related types, generated unique IDs, required
links, open metadata objects, and the safe migration report shape.
