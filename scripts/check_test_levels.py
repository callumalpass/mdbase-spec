#!/usr/bin/env python3
"""Validate test file level against spec_ref sections.

This is a guardrail to prevent lower-level test suites from
referencing higher-level spec sections.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TESTS_DIR = ROOT / "tests"

LEVEL_BY_REF_CACHE = {}


def level_for_ref(ref: str) -> int:
    """Return minimum conformance level required for a spec reference."""
    if ref in LEVEL_BY_REF_CACHE:
        return LEVEL_BY_REF_CACHE[ref]

    ref = ref.lstrip("§")
    parts = ref.split(".")
    try:
        major = int(parts[0])
    except ValueError:
        LEVEL_BY_REF_CACHE[ref] = 1
        return 1

    minor = int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else None
    subminor = parts[2] if len(parts) > 2 else None

    # Section-based mapping
    if major == 6:
        level = 2
    elif major in (10, 11):
        level = 3
    elif major == 8:
        level = 4
    elif major == 13 or major == 15:
        level = 6
    elif major == 12:
        # Operations: only some subsections are higher level
        if minor in (7, 8, 13):
            level = 6
        elif minor == 5:
            level = 5
        else:
            # Create/Read/Update/Delete/Rename/Atomicity/Formatting/Hooks/Concurrency/Init
            level = 1
    elif major == 5:
        # Type system special cases
        if ref.startswith("5.11."):
            level = 6
        elif minor == 9:
            level = 6
        elif minor in (12, 13):
            level = 3
        else:
            level = 1
    else:
        # Default for core sections (2,3,4,7,9,14, etc.)
        level = 1

    LEVEL_BY_REF_CACHE[ref] = level
    return level


def extract_spec_refs(text: str) -> list[str]:
    refs = []
    for line in text.splitlines():
        m = re.match(r"\s*spec_ref:\s*(.+)$", line)
        if not m:
            continue
        value = m.group(1).strip()
        # Remove surrounding quotes if present
        if (value.startswith('"') and value.endswith('"')) or (
            value.startswith("'") and value.endswith("'")
        ):
            value = value[1:-1]
        refs.extend(re.findall(r"§\d+(?:\.\d+)*", value))
    return refs


def extract_declared_level(text: str) -> int | None:
    for line in text.splitlines():
        m = re.match(r"\s*level:\s*(\d+)\s*$", line)
        if m:
            return int(m.group(1))
    return None


def should_ignore_guardrail(text: str) -> bool:
    for line in text.splitlines():
        m = re.match(r"\s*guardrail_ignore:\s*(.+)$", line)
        if not m:
            continue
        value = m.group(1).strip().lower()
        return value in ("true", "yes", "on")
    return False


def main() -> int:
    errors = []
    for path in sorted(TESTS_DIR.rglob("*.yaml")):
        text = path.read_text()
        if should_ignore_guardrail(text):
            continue
        declared = extract_declared_level(text)
        if declared is None:
            continue
        refs = extract_spec_refs(text)
        if not refs:
            continue
        required = max(level_for_ref(r) for r in refs)
        if declared < required:
            errors.append(
                f"{path.relative_to(ROOT)}: level {declared} < required {required} from {', '.join(sorted(set(refs)))}"
            )

    if errors:
        print("Conformance level guardrail failed:\n")
        for err in errors:
            print(f"- {err}")
        return 1

    print("Conformance level guardrail passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
