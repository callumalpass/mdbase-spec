#!/usr/bin/env python3
"""mdbase-test: Reference conformance test runner for mdbase implementations.

ADAPTER PROTOCOL
----------------
The test runner calls your implementation as a subprocess once per test case.
Your adapter reads one JSON line from stdin and writes one JSON line to stdout.

Stdin request:
  {
    "collection": "/absolute/path/to/temp/collection",
    "operation":  "read",
    "input":      { "path": "tasks/task.md" },
    "simulate":   { ... }   // optional; only present when a test requires it
  }

Stdout response (success):
  {
    "valid":       true,
    "path":        "tasks/task.md",
    "frontmatter": { "title": "...", "status": "..." },
    "body":        "..."
  }

Stdout response (error):
  {
    "valid": false,
    "error": { "code": "file_not_found", "message": "..." }
  }

Your adapter must exit with code 0 in both cases; non-zero exit codes are
treated as adapter errors, not expected operation errors.

OPERATIONS
----------
  load_config   Load and validate mdbase.yaml; return { valid, config, warnings }
  read          Read a file; return { valid, path, frontmatter, body }
  create        Create a file; return { valid, path, frontmatter }
  update        Update frontmatter fields; return { valid, path, frontmatter }
  delete        Delete a file; return { valid }
  validate      Validate a file; return { valid, issues, warnings }
  query         Query the collection; return { valid, results, meta }
  init          Initialise a new collection; return { valid }
  rename        Rename a file; return { valid, old_path, new_path }
  batch_update  Bulk update; return { valid, batch_result }
  batch_delete  Bulk delete; return { valid, batch_result }
  backfill      Backfill missing fields; return { valid, batch_result }
  create_type   Create a type definition file; return { valid, path }
  migrate       Apply a migration manifest; return { valid }
  watch         Start watcher and handle simulated events (Level 6)

SIMULATE FIELD
--------------
Some concurrency tests include a "simulate" block in the request. Your adapter
must execute the simulation between the read and write phases of the operation:

  { "simulate": { "external_modify": { "path": "...", "content": "..." } } }
  { "simulate": { "external_create": { "path": "...", "content": "..." } } }
  { "simulate": { "io_error_on": "write" } }

USAGE
-----
  # Run all tests against your implementation
  python scripts/mdbase-test.py run --impl ./my-adapter

  # Run only Level 1 tests
  python scripts/mdbase-test.py run --impl ./my-adapter --level 1

  # Run a specific category
  python scripts/mdbase-test.py run --impl ./my-adapter --category validation

  # Run a specific file
  python scripts/mdbase-test.py run --impl ./my-adapter --file tests/level-1/config.yaml

  # List available tests
  python scripts/mdbase-test.py list
  python scripts/mdbase-test.py list --level 1

REQUIREMENTS
------------
  Python 3.8+, PyYAML (pip install pyyaml)
"""

import argparse
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

try:
    import yaml
except ImportError:
    print("Error: PyYAML is required.  pip install pyyaml", file=sys.stderr)
    sys.exit(1)

# ---------------------------------------------------------------------------
# Colour helpers (disabled when stdout is not a tty)
# ---------------------------------------------------------------------------

_USE_COLOR = sys.stdout.isatty()

GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
BOLD   = "\033[1m"
DIM    = "\033[2m"
RESET  = "\033[0m"


def _c(text: str, code: str) -> str:
    return f"{code}{text}{RESET}" if _USE_COLOR else text


# ---------------------------------------------------------------------------
# Test file discovery
# ---------------------------------------------------------------------------

TESTS_DIR = Path(__file__).parent.parent / "tests"


def find_test_files(
    level: Optional[int] = None,
    category: Optional[str] = None,
    file: Optional[str] = None,
) -> List[Path]:
    if file:
        p = Path(file)
        if not p.exists():
            p = TESTS_DIR / file
        return [p]

    candidates: List[Path] = []
    if level is not None:
        level_dir = TESTS_DIR / f"level-{level}"
        if not level_dir.is_dir():
            return []
        candidates = sorted(level_dir.glob("*.yaml"))
    else:
        for d in sorted(TESTS_DIR.iterdir()):
            if d.is_dir() and d.name.startswith("level-"):
                candidates.extend(sorted(d.glob("*.yaml")))

    if category:
        filtered = []
        for p in candidates:
            with open(p) as fh:
                doc = yaml.safe_load(fh)
            if doc.get("category") == category:
                filtered.append(p)
        return filtered

    return candidates


# ---------------------------------------------------------------------------
# Collection setup
# ---------------------------------------------------------------------------

def _types_folder_from_config(config_str: str) -> str:
    """Best-effort extraction of types_folder from a YAML config string."""
    for line in str(config_str).splitlines():
        stripped = line.strip()
        if stripped.startswith("types_folder:"):
            val = stripped.split(":", 1)[1].strip().strip("\"'")
            if val:
                return val
    return "_types"


def setup_collection(tmp_dir: Path, setup: Dict) -> None:
    """Write setup files (config, types, content files) into tmp_dir."""
    if not setup:
        return

    config_content = setup.get("config")
    if config_content is not None:
        (tmp_dir / "mdbase.yaml").write_text(str(config_content), encoding="utf-8")

    types = setup.get("types") or {}
    if types:
        types_folder = _types_folder_from_config(setup.get("config") or "")
        types_dir = tmp_dir / types_folder
        types_dir.mkdir(parents=True, exist_ok=True)
        for filename, content in types.items():
            type_path = types_dir / filename
            type_path.parent.mkdir(parents=True, exist_ok=True)
            type_path.write_text(str(content), encoding="utf-8")

    files = setup.get("files") or {}
    encoding    = setup.get("encoding", "utf-8")
    line_endings = setup.get("line_endings", "LF")
    for rel_path, content in files.items():
        file_path = tmp_dir / rel_path
        file_path.parent.mkdir(parents=True, exist_ok=True)
        text = str(content) if content is not None else ""
        if line_endings == "CRLF":
            text = text.replace("\n", "\r\n")
        file_path.write_text(text, encoding=encoding)

    # Nested collection markers: a sub-path containing mdbase.yaml signals a
    # nested collection that the implementation must detect and exclude.
    # These are written above just like any other file entry.


def _merge_setup(base: Optional[Dict], override: Optional[Dict]) -> Dict:
    """Merge override on top of base (shallow merge of top-level keys)."""
    result = dict(base or {})
    if override:
        result.update(override)
    return result


# ---------------------------------------------------------------------------
# Subprocess adapter
# ---------------------------------------------------------------------------

def call_impl(
    impl: str,
    collection: Path,
    operation: str,
    input_data: Dict,
    simulate: Optional[Dict] = None,
) -> Dict:
    """Call the implementation adapter and return its parsed JSON response."""
    request: Dict[str, Any] = {
        "collection": str(collection),
        "operation":  operation,
        "input":      input_data,
    }
    if simulate:
        request["simulate"] = simulate

    try:
        proc = subprocess.run(
            [impl],
            input=json.dumps(request) + "\n",
            capture_output=True,
            text=True,
            timeout=30,
        )
    except subprocess.TimeoutExpired:
        return {"valid": False, "error": {"code": "_timeout", "message": "adapter timed out"}}
    except FileNotFoundError:
        return {"valid": False, "error": {"code": "_not_found", "message": f"adapter not found: {impl}"}}
    except Exception as exc:
        return {"valid": False, "error": {"code": "_exec_error", "message": str(exc)}}

    stdout = (proc.stdout or "").strip()
    if not stdout:
        stderr = (proc.stderr or "").strip()[:300]
        return {
            "valid": False,
            "error": {
                "code": "_no_output",
                "message": f"adapter produced no output. stderr: {stderr}",
            },
        }

    try:
        return json.loads(stdout)
    except json.JSONDecodeError as exc:
        snippet = stdout[:300]
        return {
            "valid": False,
            "error": {"code": "_invalid_json", "message": f"invalid JSON: {exc}. output: {snippet}"},
        }


# ---------------------------------------------------------------------------
# Disk helpers (for frontmatter_written / frontmatter_not_written assertions)
# ---------------------------------------------------------------------------

def _read_frontmatter_from_disk(collection: Path, rel_path: str) -> Dict:
    """Parse and return frontmatter from a file on disk (for write assertions)."""
    file_path = collection / rel_path
    if not file_path.exists():
        return {}
    try:
        raw = file_path.read_text(encoding="utf-8")
    except Exception:
        return {}
    if not raw.startswith("---"):
        return {}
    end = raw.find("\n---", 3)
    if end == -1:
        return {}
    try:
        return yaml.safe_load(raw[3:end]) or {}
    except Exception:
        return {}


# ---------------------------------------------------------------------------
# Assertion helpers
# ---------------------------------------------------------------------------

def _subset(expected: Any, actual: Any, path: str = "") -> List[str]:
    """
    Recursive subset match: every key in expected must exist in actual with an
    equal value.  Lists are compared element-wise (lengths must match).
    Returns a list of failure descriptions.
    """
    errors: List[str] = []
    if isinstance(expected, dict):
        if not isinstance(actual, dict):
            errors.append(f"{path}: expected mapping, got {type(actual).__name__} {actual!r}")
            return errors
        for key, exp_val in expected.items():
            child = f"{path}.{key}" if path else key
            if key not in actual:
                errors.append(f"{child}: key missing from response (expected {exp_val!r})")
            else:
                errors.extend(_subset(exp_val, actual[key], child))
    elif isinstance(expected, list):
        if not isinstance(actual, list):
            errors.append(f"{path}: expected list, got {type(actual).__name__} {actual!r}")
            return errors
        if len(expected) != len(actual):
            errors.append(
                f"{path}: expected {len(expected)} items, got {len(actual)}: {actual!r}"
            )
        else:
            for i, (e, a) in enumerate(zip(expected, actual)):
                errors.extend(_subset(e, a, f"{path}[{i}]"))
    else:
        if expected != actual:
            errors.append(f"{path}: expected {expected!r}, got {actual!r}")
    return errors


def _check_issues(expected: List[Dict], actual: List[Dict]) -> List[str]:
    """
    Each expected issue must be matched by at least one actual issue.
    Matching is on all keys except 'message'.
    """
    errors: List[str] = []
    actual = actual or []
    for exp in expected:
        match_keys = {k: v for k, v in exp.items() if k != "message"}
        matched = any(
            all(act.get(k) == v for k, v in match_keys.items())
            for act in actual
        )
        if not matched:
            errors.append(f"issues: expected {exp!r} not matched in {actual!r}")
    return errors


def _check_warnings(expected: List, actual: List) -> List[str]:
    """
    Each expected warning (string or {contains: "..."} dict) must match at
    least one item in actual (case-insensitive substring check).
    """
    errors: List[str] = []
    actual_strs = [str(w).lower() for w in (actual or [])]
    for exp in expected:
        pattern = exp["contains"] if isinstance(exp, dict) else str(exp)
        if not any(pattern.lower() in s for s in actual_strs):
            errors.append(f"warnings: nothing contains {pattern!r}. Got: {actual!r}")
    return errors


def _check_results(expected: List, actual: List) -> List[str]:
    """Ordered subset match for query results."""
    errors: List[str] = []
    actual = actual or []
    if len(expected) > len(actual):
        errors.append(f"results: expected ≥{len(expected)} items, got {len(actual)}")
        return errors
    for i, exp_item in enumerate(expected):
        errors.extend(_subset(exp_item, actual[i], f"results[{i}]"))
    return errors


# ---------------------------------------------------------------------------
# Full response assertion
# ---------------------------------------------------------------------------

def assert_response(
    test_case: Dict,
    response: Dict,
    collection: Path,
    expect: Dict,
    impl: str,
) -> List[str]:
    """Check all assertion fields in expect against response. Returns failure list."""
    errors: List[str] = []

    # ---- valid ----
    if "valid" in expect:
        got = response.get("valid")
        if got != expect["valid"]:
            errors.append(f"valid: expected {expect['valid']!r}, got {got!r}")
            if expect["valid"] is True and response.get("error"):
                errors.append(f"  (error was: {response['error']})")

    # ---- error ----
    if "error" in expect:
        exp_err = expect["error"]
        act_err = response.get("error")
        if act_err is None:
            errors.append(f"error: expected {exp_err!r}, got no error in response")
        else:
            if "code" in exp_err and act_err.get("code") != exp_err["code"]:
                errors.append(
                    f"error.code: expected {exp_err['code']!r}, got {act_err.get('code')!r}"
                )

    # ---- path ----
    if "path" in expect:
        if response.get("path") != expect["path"]:
            errors.append(f"path: expected {expect['path']!r}, got {response.get('path')!r}")

    # ---- frontmatter (subset) ----
    if "frontmatter" in expect:
        errors.extend(_subset(expect["frontmatter"], response.get("frontmatter") or {}, "frontmatter"))

    # ---- config (subset) ----
    if "config" in expect:
        errors.extend(_subset(expect["config"], response.get("config") or {}, "config"))

    # ---- issues ----
    if "issues" in expect:
        errors.extend(_check_issues(expect["issues"], response.get("issues") or []))

    # ---- warnings ----
    if "warnings" in expect:
        errors.extend(_check_warnings(expect["warnings"], response.get("warnings") or []))

    # ---- results (query) ----
    if "results" in expect:
        errors.extend(_check_results(expect["results"], response.get("results") or []))

    # ---- meta (query metadata) ----
    if "meta" in expect:
        errors.extend(_subset(expect["meta"], response.get("meta") or {}, "meta"))

    # ---- body_contains ----
    if "body_contains" in expect:
        body = response.get("body") or ""
        if expect["body_contains"] not in body:
            errors.append(
                f"body_contains: {expect['body_contains']!r} not found in body"
            )

    # ---- batch_result ----
    if "batch_result" in expect:
        act = response.get("batch_result") or response
        errors.extend(_subset(expect["batch_result"], act, "batch_result"))

    # ---- size_positive ----
    if expect.get("size_positive"):
        size = response.get("size") or (response.get("file") or {}).get("size")
        if not isinstance(size, (int, float)) or size <= 0:
            errors.append(f"size_positive: expected positive integer, got {size!r}")

    # ---- mtime_present ----
    if expect.get("mtime_present"):
        mtime = response.get("mtime") or (response.get("file") or {}).get("mtime")
        if not mtime:
            errors.append("mtime_present: mtime not present in response")

    # ---- ctime_present ----
    if expect.get("ctime_present"):
        ctime = response.get("ctime") or (response.get("file") or {}).get("ctime")
        if not ctime:
            errors.append("ctime_present: ctime not present in response")

    # ---- message_present (issues must all have a message) ----
    if expect.get("message_present"):
        for issue in response.get("issues") or []:
            if not issue.get("message"):
                errors.append(f"message_present: issue missing message: {issue!r}")

    # ---- frontmatter_written (check persisted file on disk) ----
    if "frontmatter_written" in expect:
        rel = test_case.get("input", {}).get("path") or response.get("path")
        if rel:
            disk_fm = _read_frontmatter_from_disk(collection, rel)
            errors.extend(_subset(expect["frontmatter_written"], disk_fm, "frontmatter_written"))

    # ---- frontmatter_not_written ----
    if "frontmatter_not_written" in expect:
        rel = test_case.get("input", {}).get("path") or response.get("path")
        if rel:
            disk_fm = _read_frontmatter_from_disk(collection, rel)
            for field in expect["frontmatter_not_written"]:
                if field in disk_fm:
                    errors.append(
                        f"frontmatter_not_written: field {field!r} found on disk"
                    )

    # ---- frontmatter_not_bare_null ----
    if "frontmatter_not_bare_null" in expect:
        rel = test_case.get("input", {}).get("path") or response.get("path")
        if rel:
            fp = collection / rel
            if fp.exists():
                raw = fp.read_text(encoding="utf-8")
                for field in expect["frontmatter_not_bare_null"]:
                    # Bare null: "field:\n" or "field: \n"
                    if f"\n{field}:\n" in raw or f"\n{field}: \n" in raw:
                        errors.append(
                            f"frontmatter_not_bare_null: {field!r} written as bare null"
                        )

    # ---- frontmatter_changed ----
    if "frontmatter_changed" in expect:
        rel = test_case.get("input", {}).get("path") or response.get("path")
        if rel:
            disk_fm = _read_frontmatter_from_disk(collection, rel)
            orig_fm = test_case.get("_original_frontmatter") or {}
            for field in expect["frontmatter_changed"]:
                if disk_fm.get(field) == orig_fm.get(field):
                    errors.append(
                        f"frontmatter_changed: field {field!r} has not changed"
                    )

    # ---- verify_after: run a follow-up operation ----
    if "verify_after" in expect:
        va = expect["verify_after"]
        va_op     = va.get("operation")
        va_input  = va.get("input") or {}
        va_expect = va.get("expect") or {}
        va_resp   = call_impl(impl, collection, va_op, va_input)
        for err in assert_response({"input": va_input}, va_resp, collection, va_expect, impl):
            errors.append(f"verify_after.{err}")

    return errors


# ---------------------------------------------------------------------------
# Result dataclass
# ---------------------------------------------------------------------------

class TestResult:
    __slots__ = ("name", "passed", "errors", "skipped")

    def __init__(
        self,
        name: str,
        passed: bool,
        errors: Optional[List[str]] = None,
        skipped: bool = False,
    ):
        self.name    = name
        self.passed  = passed
        self.errors  = errors or []
        self.skipped = skipped


# ---------------------------------------------------------------------------
# Test file runner
# ---------------------------------------------------------------------------

def run_test_file(
    test_file: Path,
    impl: str,
) -> Tuple[List[TestResult], int, int, int]:
    """
    Run every test in a YAML test file.
    Returns (results, passed_count, failed_count, skipped_count).
    """
    with open(test_file) as fh:
        doc = yaml.safe_load(fh)

    file_setup = doc.get("setup")
    groups = doc.get("groups") or []

    # Support flat test files (no groups)
    if not groups and doc.get("tests"):
        groups = [{"name": "", "setup": file_setup, "tests": doc["tests"]}]

    all_results: List[TestResult] = []
    passed = failed = skipped = 0

    for group in groups:
        group_setup = _merge_setup(file_setup, group.get("setup"))
        group_name  = group.get("name", "")
        tests       = group.get("tests") or []

        for test in tests:
            test_name = test.get("name", "unnamed")
            full_name = f"{group_name} > {test_name}" if group_name else test_name

            # Test-level setup overrides group-level
            effective_setup = _merge_setup(group_setup, test.get("setup"))

            operation  = test.get("operation")
            input_data = test.get("input") or {}
            simulate   = test.get("simulate")
            expect     = test.get("expect") or {}

            if not operation:
                all_results.append(TestResult(full_name, True, skipped=True))
                skipped += 1
                continue

            with tempfile.TemporaryDirectory(prefix="mdbase-test-") as tmp_str:
                tmp_dir = Path(tmp_str)
                try:
                    setup_collection(tmp_dir, effective_setup)
                except Exception as exc:
                    all_results.append(
                        TestResult(full_name, False, [f"Setup error: {exc}"])
                    )
                    failed += 1
                    continue

                response = call_impl(impl, tmp_dir, operation, input_data, simulate)
                errors   = assert_response(test, response, tmp_dir, expect, impl)

            if errors:
                all_results.append(TestResult(full_name, False, errors))
                failed += 1
            else:
                all_results.append(TestResult(full_name, True))
                passed += 1

    return all_results, passed, failed, skipped


# ---------------------------------------------------------------------------
# CLI commands
# ---------------------------------------------------------------------------

def cmd_run(args: argparse.Namespace) -> None:
    impl = args.impl
    if not os.path.isabs(impl):
        impl = os.path.abspath(impl)

    test_files = find_test_files(level=args.level, category=args.category, file=args.file)
    if not test_files:
        print("No test files matched.", file=sys.stderr)
        sys.exit(1)

    total_passed = total_failed = total_skipped = 0

    for test_file in test_files:
        label = f"{test_file.parent.name}/{test_file.stem}"
        print(f"\n{_c(label, BOLD)}")

        results, passed, failed, skipped = run_test_file(test_file, impl)
        total_passed  += passed
        total_failed  += failed
        total_skipped += skipped

        for r in results:
            if r.skipped:
                print(f"  {_c('⊙', YELLOW)} {_c(r.name, DIM)}")
            elif r.passed:
                print(f"  {_c('✓', GREEN)} {r.name}")
            else:
                print(f"  {_c('✗', RED)} {r.name}")
                for err in r.errors:
                    print(f"      {_c(err, RED)}")

    print()
    print("─" * 60)
    parts = [f"{total_passed} passed"]
    if total_failed:
        parts.append(_c(f"{total_failed} failed", RED))
    if total_skipped:
        parts.append(_c(f"{total_skipped} skipped", YELLOW))
    print("  " + ", ".join(parts))

    if total_failed:
        sys.exit(1)


def cmd_list(args: argparse.Namespace) -> None:
    test_files = find_test_files(level=args.level, category=args.category)
    for tf in test_files:
        with open(tf) as fh:
            doc = yaml.safe_load(fh)
        lv   = doc.get("level", "?")
        cat  = doc.get("category", "?")
        name = doc.get("name", tf.stem)
        groups = doc.get("groups") or []
        count = sum(len(g.get("tests") or []) for g in groups)
        if not groups and doc.get("tests"):
            count = len(doc["tests"])
        print(f"level-{lv}  [{cat:20s}]  {tf.name}  ({count} tests)  {name}")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        prog="mdbase-test",
        description="mdbase conformance test runner",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    sub = parser.add_subparsers(dest="command")

    run_p = sub.add_parser("run", help="Run conformance tests")
    run_p.add_argument("--impl",     required=True, help="Path to implementation adapter executable")
    run_p.add_argument("--level",    type=int,       help="Run only tests for this conformance level (1–6)")
    run_p.add_argument("--category",                 help="Run only tests matching this category")
    run_p.add_argument("--file",                     help="Run only this specific test file")

    list_p = sub.add_parser("list", help="List available tests")
    list_p.add_argument("--level",    type=int, help="Filter by conformance level")
    list_p.add_argument("--category",            help="Filter by category")

    args = parser.parse_args()

    if args.command == "run":
        cmd_run(args)
    elif args.command == "list":
        cmd_list(args)
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
