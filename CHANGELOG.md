# Changelog

All notable changes to this specification and conformance suite are documented here.

## 2026-02-03 (v0.2.0)

### Added
- Level 6 migration manifests and `migrate` operation (§5.11.1, §12.13).
- Level 6 `backfill` operation for applying defaults/generated fields to missing values (§12.8).
- `settings.migrations_folder` for locating migration manifests.
- Conformance tests for migration and backfill (Level 6).
- CI guardrail to prevent conformance-level drift in tests.
- Expression scoping rule: `value/index/acc` shadow frontmatter fields inside list methods.

### Changed
- Version bumped to 0.2.0 across spec and website.
- Removed “Draft” status label from the overview header.
- Updated error codes with `invalid_migration` and `migration_failed`.
- Clarified ambiguous link severity (error on ID ambiguity, warning after tiebreakers).
- Added portability note for `settings.timezone`.

### Fixed
- Corrected formatting error in §11.10 (Missing vs null block).

## 2026-02-02

### Added
- Self-describing chapter and appendix frontmatter across spec files.
- `_types/` definitions for chapters/appendices and base section metadata.
- Additional Level 6 tests: batch dry-run, batch type rename, nested collections, and watch ordering.
- Regex-matches tests moved into their own Level 3 file.

### Changed
- Reorganized conformance tests: create match-rule enforcement moved to Level 2, batch tests moved to Level 6.
- Added `settings.timezone` for `now()`/`today()` control and naive datetime comparison.
- Required explicit `reduce()` init value in expressions.

### Fixed
- Restored two `explicit_type_keys` tests to the correct group after reorganization.
- Added missing `priority` to query-namespaces test fixture for note.* vs default semantics.

## 2026-02-01

### Added
- `settings.write_defaults` (default `true`) to control default materialization on disk.
- `generated: {random: N}` and `generated: sequence` strategies, plus validation for invalid configs.
- `generated: {from: file.*}` support (`file.name`, `file.basename`, `file.ext`, `file.path`, `file.folder`).
- `display_name_key` on types and `file.display_name` metadata property.
- `init` operation in §12.11 and required meta type creation in the types folder.
- `match_failed` error code for explicit-type creates that do not satisfy match rules.
- Conformance tests for path-based type matching on update, explicit type key handling, init, and new generation strategies.
- Conformance tests for type loading order, types-folder subdirectory scanning, meta type schema, and `reduce()` init requirement.
- Conformance test rejecting `path_pattern` references to `file.*`-generated fields.
- `settings.timezone` to control `now()`/`today()` and naive datetime comparisons (defaults to local timezone).
- Conformance tests for batch dry-run, batch type renames, nested collection boundaries, and mixed-event watch ordering.

### Changed
- `filename_pattern` renamed to `path_pattern` (deprecated alias preserved); examples and validation text updated.
- Create path derivation now explicitly uses **effective** frontmatter (defaults + generated values).
- Create output now MUST include the final `path`.
- Create with explicit type now MUST satisfy the type's match rules.
- Field override rules now explicitly warn that overrides replace all properties (including `generated`).
- Default materialization behavior updated to be driven by `settings.write_defaults`.
- `order_by` on non-scalar fields now requires deterministic sorting (with optional warning), not rejection.
- `reduce()` requires an explicit initial accumulator value; missing `init` is `wrong_argument_count`.
- Type definitions that reference `file.*`-generated fields in `path_pattern` must be rejected (`invalid_type_definition`).
- Create match-rule enforcement is now explicitly a Level 2+ requirement; Level 1 may skip.

### Fixed / Clarified
- Unresolvable `path_pattern` variables now fail with `path_required`, with type-load warnings for unknown variables.
- Added tests for `path_pattern` aliasing and generated/default-based path derivation.
- Missing/null match conditions and match-rule evaluation errors now explicitly result in non-match (no error).
- Formula runtime errors now yield `formula_evaluation_error` (Appendix C.5).
- Enum values must be non-empty; integer/number minimum range and precision clarified.
- Reads respect scanning exclusions; `file.basename` definition aligned across sections.
