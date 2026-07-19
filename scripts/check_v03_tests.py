#!/usr/bin/env python3
"""Validate the parallel mdbase v0.3 conformance suite.

This is not a v0.3 implementation adapter. It checks suite structure and executes
artifact-level tests that can run directly in this repository:

- JSON Schema files validate against Draft 2020-12
- Markdown frontmatter validates against selected schemas
- embedded JSON Schemas validate against Draft 2020-12
- JSON documents parse and optionally validate against schemas
- YAML documents parse and optionally validate against schemas
- simple YAML pointer presence checks
- the TaskNotes migration prototype can satisfy fixture report assertions

Adapter-target tests for core collection behavior, lifecycle, CEL, and runtime
execution are shape-checked but not executed here.
"""

from __future__ import annotations

import argparse
import glob
import json
import sys
from pathlib import Path
from typing import Any, Iterable

try:
    import yaml
except ImportError:
    print("PyYAML is required. Install with: pip install pyyaml", file=sys.stderr)
    sys.exit(1)

try:
    from jsonschema import Draft202012Validator
except ImportError:
    print("jsonschema is required. Install with: pip install jsonschema", file=sys.stderr)
    sys.exit(1)


REPO_ROOT = Path(__file__).resolve().parent.parent
TEST_ROOT = REPO_ROOT / "tests" / "v0.3"

EXECUTABLE_OPERATIONS = {
    "json_schema_meta_validate",
    "markdown_frontmatter_schema_validate",
    "embedded_json_schema_validate",
    "json_document_schema_validate",
    "yaml_document_schema_validate",
    "json_document_valid",
    "inspect_yaml",
    "migrate_type",
}

CONFORMANCE_PROFILES = {
    "core_read",
    "collection_semantics",
    "cel_query",
    "links",
    "core_write",
    "lifecycle",
    "runtime_contracts/0.1",
    "workflow/0.1",
    "watch",
}


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate mdbase v0.3 conformance fixtures")
    parser.add_argument(
        "--execute-only",
        action="store_true",
        help="fail if a test uses an operation this script cannot execute",
    )
    args = parser.parse_args()

    errors: list[str] = []
    executed = 0
    skipped = 0

    manifest_path = TEST_ROOT / "manifest.yaml"
    fixture_sets, claim_requirements, coverage_complete = validate_manifest(manifest_path, errors)
    referenced_files = {
        file_name
        for fixture_set in fixture_sets.values()
        for file_name in fixture_set.get("files", []) or []
    }
    covered_requirements: set[str] = set()
    test_ids: set[str] = set()

    for suite_path in sorted(TEST_ROOT.glob("**/*.yaml")):
        if suite_path == manifest_path:
            continue
        suite = load_yaml(suite_path)
        relative_path = suite_path.relative_to(TEST_ROOT).as_posix()
        validate_suite_shape(
            suite_path,
            suite,
            fixture_sets,
            relative_path,
            claim_requirements,
            covered_requirements,
            test_ids,
            errors,
        )
        if relative_path not in referenced_files:
            errors.append(f"{suite_path}: suite is not referenced by manifest.yaml")
        for group in suite.get("groups", []) or []:
            for test in group.get("tests", []) or []:
                operation = test.get("operation")
                if operation in EXECUTABLE_OPERATIONS:
                    try:
                        run_executable_test(test, group.get("setup") or {})
                        executed += 1
                    except Exception as exc:  # noqa: BLE001 - diagnostic script should report all failures uniformly.
                        errors.append(f"{suite_path}: {test.get('name', '<unnamed>')}: {exc}")
                else:
                    skipped += 1
                    if args.execute_only:
                        errors.append(f"{suite_path}: unsupported executable operation {operation!r}")

    for profile_id, requirements in coverage_complete.items():
        missing = sorted(requirements - covered_requirements)
        if missing:
            errors.append(
                f"{manifest_path}: coverage_complete profile {profile_id} has uncovered requirements: {missing}"
            )

    if errors:
        print("\n".join(errors), file=sys.stderr)
        print(f"v0.3 suite check failed: {len(errors)} error(s), {executed} executable test(s), {skipped} adapter-target test(s)", file=sys.stderr)
        return 1

    print(f"v0.3 suite ok: {executed} executable test(s), {skipped} adapter-target test(s)")
    return 0


def validate_manifest(
    path: Path, errors: list[str]
) -> tuple[dict[str, dict[str, Any]], set[str], dict[str, set[str]]]:
    manifest = load_yaml(path)
    if manifest.get("spec_version") != "0.3.0":
        errors.append(f"{path}: manifest spec_version must be 0.3.0")
    fixture_sets = manifest.get("fixture_sets")
    if not isinstance(fixture_sets, list) or not fixture_sets:
        errors.append(f"{path}: manifest fixture_sets must be a non-empty list")
        fixture_sets = []
    claim_requirements, coverage_complete = validate_claim_profiles(path, manifest, errors)
    by_id: dict[str, dict[str, Any]] = {}
    referenced_files: set[str] = set()
    for fixture_set in fixture_sets:
        fixture_set_id = fixture_set.get("id")
        if not isinstance(fixture_set_id, str) or not fixture_set_id:
            errors.append(f"{path}: every fixture set must have a non-empty id")
            continue
        if fixture_set_id in by_id:
            errors.append(f"{path}: duplicate fixture set id: {fixture_set_id}")
        by_id[fixture_set_id] = fixture_set
        targets = fixture_set.get("coverage_targets")
        if not isinstance(targets, list):
            errors.append(f"{path}: fixture set {fixture_set_id} coverage_targets must be a list")
        else:
            unknown = sorted(set(targets) - CONFORMANCE_PROFILES)
            if unknown:
                errors.append(f"{path}: fixture set {fixture_set_id} has unknown coverage targets: {unknown}")
        files = fixture_set.get("files")
        if not isinstance(files, list) or not files:
            errors.append(f"{path}: fixture set {fixture_set_id} files must be a non-empty list")
            continue
        for file_name in files:
            if not (TEST_ROOT / file_name).exists():
                errors.append(f"{path}: referenced test file does not exist: {file_name}")
            if file_name in referenced_files:
                errors.append(f"{path}: test file is referenced more than once: {file_name}")
            referenced_files.add(file_name)
    return by_id, claim_requirements, coverage_complete


def validate_claim_profiles(
    path: Path, manifest: dict[str, Any], errors: list[str]
) -> tuple[set[str], dict[str, set[str]]]:
    profiles = manifest.get("claim_profiles")
    if not isinstance(profiles, list):
        errors.append(f"{path}: claim_profiles must be a list")
        return set(), {}
    by_id = {
        profile.get("id"): profile
        for profile in profiles
        if isinstance(profile, dict) and isinstance(profile.get("id"), str)
    }
    missing_profiles = sorted(CONFORMANCE_PROFILES - set(by_id))
    unknown_profiles = sorted(set(by_id) - CONFORMANCE_PROFILES)
    if missing_profiles:
        errors.append(f"{path}: missing claim profile definitions: {missing_profiles}")
    if unknown_profiles:
        errors.append(f"{path}: unknown claim profile definitions: {unknown_profiles}")

    known_requirements: set[str] = set()
    coverage_complete: dict[str, set[str]] = {}
    for profile_id, profile in by_id.items():
        status = profile.get("status")
        if status not in {"draft", "coverage_complete"}:
            errors.append(f"{path}: claim profile {profile_id} has invalid status {status!r}")
        requires = profile.get("requires")
        if not isinstance(requires, list):
            errors.append(f"{path}: claim profile {profile_id} requires must be a list")
        else:
            unknown_dependencies = sorted(set(requires) - CONFORMANCE_PROFILES)
            if unknown_dependencies:
                errors.append(
                    f"{path}: claim profile {profile_id} has unknown dependencies: {unknown_dependencies}"
                )
        requirements = profile.get("requirements")
        if not isinstance(requirements, list):
            errors.append(f"{path}: claim profile {profile_id} requirements must be a list")
            continue
        qualified = {f"{profile_id}.{requirement}" for requirement in requirements}
        if len(qualified) != len(requirements):
            errors.append(f"{path}: claim profile {profile_id} has duplicate requirements")
        known_requirements.update(qualified)
        if status == "coverage_complete":
            if not requirements:
                errors.append(
                    f"{path}: coverage_complete profile {profile_id} must declare requirements"
                )
            coverage_complete[profile_id] = qualified
    return known_requirements, coverage_complete


def validate_suite_shape(
    path: Path,
    suite: dict[str, Any],
    fixture_sets: dict[str, dict[str, Any]],
    relative_path: str,
    claim_requirements: set[str],
    covered_requirements: set[str],
    test_ids: set[str],
    errors: list[str],
) -> None:
    required = ["name", "spec_version", "fixture_set", "category", "spec_ref", "groups"]
    for key in required:
        if key not in suite:
            errors.append(f"{path}: missing required top-level key {key}")
    if suite.get("spec_version") != "0.3.0":
        errors.append(f"{path}: spec_version must be 0.3.0")
    fixture_set_id = suite.get("fixture_set")
    fixture_set = fixture_sets.get(fixture_set_id)
    if fixture_set is None:
        errors.append(f"{path}: unknown fixture_set {fixture_set_id!r}")
    elif relative_path not in (fixture_set.get("files") or []):
        errors.append(f"{path}: fixture_set {fixture_set_id!r} does not reference this suite")
    groups = suite.get("groups")
    if not isinstance(groups, list) or not groups:
        errors.append(f"{path}: groups must be a non-empty list")
        return
    for group_index, group in enumerate(groups):
        if "name" not in group:
            errors.append(f"{path}: group {group_index} missing name")
        validate_setup_artifacts(path, group, errors)
        tests = group.get("tests")
        if not isinstance(tests, list) or not tests:
            errors.append(f"{path}: group {group.get('name', group_index)!r} has no tests")
            continue
        for test_index, test in enumerate(tests):
            for key in ["name", "operation", "input", "expect"]:
                if key not in test:
                    errors.append(f"{path}: test {test_index} in group {group.get('name', group_index)!r} missing {key}")
            covers = test.get("covers")
            if covers is None:
                continue
            if not isinstance(covers, list) or not covers:
                errors.append(
                    f"{path}: test {test.get('name', test_index)!r} covers must be a non-empty list"
                )
                continue
            test_id = test.get("id")
            if not isinstance(test_id, str) or not test_id:
                errors.append(f"{path}: covered test {test_index} must have a non-empty id")
            elif test_id in test_ids:
                errors.append(f"{path}: duplicate test id: {test_id}")
            else:
                test_ids.add(test_id)
            unknown_requirements = sorted(set(covers) - claim_requirements)
            if unknown_requirements:
                errors.append(
                    f"{path}: test {test_id or test_index} covers unknown requirements: {unknown_requirements}"
                )
            covered_requirements.update(set(covers) & claim_requirements)


def validate_setup_artifacts(path: Path, group: dict[str, Any], errors: list[str]) -> None:
    setup = group.get("setup") or {}
    types = setup.get("types") or {}
    if not isinstance(types, dict):
        errors.append(f"{path}: group {group.get('name')!r} setup.types must be a mapping")
        return
    for file_name, content in types.items():
        if not isinstance(content, str):
            errors.append(f"{path}: setup type {file_name} content must be a string")
            continue
        label = f"{path}: setup type {file_name}"
        try:
            if str(file_name).endswith(".md"):
                frontmatter = parse_markdown_frontmatter_text(content, label)
                if not isinstance(frontmatter.get("name"), str) or not frontmatter["name"]:
                    errors.append(f"{label}: missing non-empty frontmatter name")
            elif str(file_name).endswith(".json"):
                parsed = json.loads(content)
                if not isinstance(parsed, dict):
                    errors.append(f"{label}: JSON schema fixture must be an object")
        except (ValueError, json.JSONDecodeError, yaml.YAMLError) as error:
            errors.append(f"{label}: {error}")


def run_executable_test(test: dict[str, Any], setup: dict[str, Any] | None = None) -> None:
    operation = test["operation"]
    input_data = test.get("input") or {}
    expect = test.get("expect") or {}
    setup = setup or {}

    if operation == "json_schema_meta_validate":
        for path in expand_paths(input_data.get("paths", [])):
            Draft202012Validator.check_schema(load_json(path))
        assert_valid(expect)
        return

    if operation == "markdown_frontmatter_schema_validate":
        schema = load_json(resolve(input_data["schema"]))
        validator = Draft202012Validator(schema)
        for path in expand_paths(input_data.get("paths", [])):
            errors = list(validator.iter_errors(load_markdown_frontmatter(path)))
            if errors:
                raise AssertionError(format_schema_errors(path, errors))
        assert_valid(expect)
        return

    if operation == "embedded_json_schema_validate":
        pointer = input_data.get("pointer", "/schema/value")
        for path in expand_paths(input_data.get("paths", [])):
            embedded = get_pointer(load_markdown_frontmatter(path), pointer)
            Draft202012Validator.check_schema(embedded)
        assert_valid(expect)
        return

    if operation == "json_document_schema_validate":
        schema = load_json(resolve(input_data["schema"]))
        validator = Draft202012Validator(schema)
        for path in expand_paths(input_data.get("paths", [])):
            errors = list(validator.iter_errors(load_json(path)))
            assert_document_schema_result(path, errors, expect)
        return

    if operation == "yaml_document_schema_validate":
        schema = load_json(resolve(input_data["schema"]))
        validator = Draft202012Validator(schema)
        for path in expand_paths(input_data.get("paths", [])):
            errors = list(validator.iter_errors(load_yaml(path)))
            assert_document_schema_result(path, errors, expect)
        return

    if operation == "json_document_valid":
        for path in expand_paths(input_data.get("paths", [])):
            load_json(path)
        assert_valid(expect)
        return

    if operation == "inspect_yaml":
        data = load_markdown_frontmatter(resolve(input_data["path"]))
        for pointer in expect.get("has", []) or []:
            get_pointer(data, pointer)
        for pointer in expect.get("not_has", []) or []:
            if pointer_exists(data, pointer):
                raise AssertionError(f"unexpected pointer exists: {pointer}")
        return

    if operation == "migrate_type":
        run_migrate_type_test(input_data, expect, setup)
        return

    raise AssertionError(f"unsupported operation: {operation}")


def assert_valid(expect: dict[str, Any]) -> None:
    if expect.get("valid") is False:
        raise AssertionError("test expected invalid result, but executable artifact check only supports valid=true cases")


def assert_document_schema_result(path: Path, errors: list[Any], expect: dict[str, Any]) -> None:
    if expect.get("valid") is False:
        if not errors:
            raise AssertionError(f"{path}: expected schema validation to fail")
        return
    if errors:
        raise AssertionError(format_schema_errors(path, errors))


def run_migrate_type_test(input_data: dict[str, Any], expect: dict[str, Any], setup: dict[str, Any]) -> None:
    if input_data.get("mode") != "dry_run":
        raise AssertionError("prototype migrate_type executable only supports dry_run mode")

    import prototype_tasknotes_v03_migration as tasknotes_migration  # type: ignore[import-not-found]

    fixture_root = resolve(setup.get("expected_report", "examples/v0.3/tasknotes-migration/migration-report.json")).parent
    source = resolve(input_data["source"])
    if not source.exists():
        source = fixture_root / input_data["source"]
    old = tasknotes_migration.read_markdown_frontmatter(source)
    migrated = tasknotes_migration.migrate_tasknotes_type(old)
    tasknotes_migration.validate_type_file(migrated)
    report = tasknotes_migration.build_report(old, migrated)

    if expect.get("valid") is not None and expect["valid"] is not True:
        raise AssertionError("prototype migrate_type executable only supports valid=true fixture checks")
    if expect.get("detected_source_version") and expect["detected_source_version"] != "0.2.1":
        raise AssertionError("detected_source_version mismatch")
    if expect.get("detected_generator") and expect["detected_generator"] != "tasknotes":
        raise AssertionError("detected_generator mismatch")
    if subset := expect.get("report_contains"):
        assert_subset(report, subset)


def assert_subset(actual: Any, expected_subset: Any) -> None:
    if isinstance(expected_subset, dict):
        if not isinstance(actual, dict):
            raise AssertionError(f"expected mapping subset {expected_subset!r}, got {actual!r}")
        for key, value in expected_subset.items():
            if key not in actual:
                raise AssertionError(f"missing key in actual value: {key}")
            assert_subset(actual[key], value)
        return

    if isinstance(expected_subset, list):
        if not isinstance(actual, list):
            raise AssertionError(f"expected list subset {expected_subset!r}, got {actual!r}")
        for expected_item in expected_subset:
            if isinstance(expected_item, (dict, list)):
                if not any(subset_matches(actual_item, expected_item) for actual_item in actual):
                    raise AssertionError(f"missing list subset item: {expected_item!r}")
            elif expected_item not in actual:
                raise AssertionError(f"missing list item: {expected_item!r}")
        return

    if actual != expected_subset:
        raise AssertionError(f"expected {expected_subset!r}, got {actual!r}")


def subset_matches(actual: Any, expected_subset: Any) -> bool:
    try:
        assert_subset(actual, expected_subset)
        return True
    except AssertionError:
        return False


def expand_paths(patterns: Iterable[str]) -> list[Path]:
    paths: list[Path] = []
    for pattern in patterns:
        matches = [Path(p) for p in glob.glob(str(resolve(pattern)), recursive=True)]
        if not matches:
            raise AssertionError(f"pattern matched no files: {pattern}")
        paths.extend(matches)
    return sorted(set(paths))


def resolve(path: str | Path) -> Path:
    candidate = Path(path)
    if candidate.is_absolute():
        return candidate
    return REPO_ROOT / candidate


def load_json(path: str | Path) -> Any:
    with resolve(path).open(encoding="utf-8") as handle:
        return json.load(handle)


def load_yaml(path: Path) -> dict[str, Any]:
    with path.open(encoding="utf-8") as handle:
        loaded = yaml.safe_load(handle)
    if not isinstance(loaded, dict):
        raise ValueError(f"{path}: expected YAML mapping")
    return loaded


def load_markdown_frontmatter(path: str | Path) -> dict[str, Any]:
    text = resolve(path).read_text(encoding="utf-8")
    return parse_markdown_frontmatter_text(text, str(path))


def parse_markdown_frontmatter_text(text: str, label: str) -> dict[str, Any]:
    if not text.startswith("---\n"):
        raise ValueError(f"{label}: missing opening frontmatter delimiter")
    end = text.find("\n---\n", 4)
    if end == -1:
        raise ValueError(f"{label}: missing closing frontmatter delimiter")
    loaded = yaml.safe_load(text[4:end])
    if loaded is None:
        return {}
    if not isinstance(loaded, dict):
        raise ValueError(f"{label}: frontmatter must be a mapping")
    return loaded


def get_pointer(value: Any, pointer: str) -> Any:
    current = value
    if pointer in ("", "/"):
        return current
    for raw_part in pointer.strip("/").split("/"):
        part = raw_part.replace("~1", "/").replace("~0", "~")
        if isinstance(current, dict) and part in current:
            current = current[part]
        elif isinstance(current, list) and part.isdigit() and int(part) < len(current):
            current = current[int(part)]
        else:
            raise KeyError(pointer)
    return current


def pointer_exists(value: Any, pointer: str) -> bool:
    try:
        get_pointer(value, pointer)
        return True
    except KeyError:
        return False


def format_schema_errors(path: Path, errors: list[Any]) -> str:
    formatted = []
    for error in errors:
        location = "/" + "/".join(str(part) for part in error.path)
        formatted.append(f"{path}:{location}: {error.message}")
    return "\n".join(formatted)


if __name__ == "__main__":
    raise SystemExit(main())
