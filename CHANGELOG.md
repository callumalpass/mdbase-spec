# Changelog

All notable changes to this specification and conformance suite are documented here.

## 2026-02-01

### Added
- `settings.write_defaults` (default `true`) to control default materialization on disk.
- `generated: {random: N}` and `generated: sequence` strategies, plus validation for invalid configs.
- `generated: {from: file.*}` support (`file.name`, `file.basename`, `file.ext`, `file.path`, `file.folder`).
- `display_name_key` on types and `file.display_name` metadata property.
- `init` operation in §12.11 and required meta type creation in the types folder.
- `match_failed` error code for explicit-type creates that do not satisfy match rules.
- Conformance tests for path-based type matching on update, explicit type key handling, init, and new generation strategies.

### Changed
- `filename_pattern` renamed to `path_pattern` (deprecated alias preserved); examples and validation text updated.
- Create path derivation now explicitly uses **effective** frontmatter (defaults + generated values).
- Create output now MUST include the final `path`.
- Create with explicit type now MUST satisfy the type's match rules.
- Field override rules now explicitly warn that overrides replace all properties (including `generated`).
- Default materialization behavior updated to be driven by `settings.write_defaults`.

### Fixed / Clarified
- Unresolvable `path_pattern` variables now fail with `path_required`, with type-load warnings for unknown variables.
- Added tests for `path_pattern` aliasing and generated/default-based path derivation.
