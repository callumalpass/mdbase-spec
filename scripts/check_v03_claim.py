#!/usr/bin/env python3
"""Validate one or more mdbase v0.3 conformance claim documents."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

try:
    import yaml
except ImportError:
    print("PyYAML is required. Install with: pip install pyyaml", file=sys.stderr)
    sys.exit(1)

try:
    from jsonschema import Draft202012Validator, FormatChecker
except ImportError:
    print("jsonschema is required. Install with: pip install jsonschema", file=sys.stderr)
    sys.exit(1)


REPO_ROOT = Path(__file__).resolve().parent.parent
SCHEMA_PATH = REPO_ROOT / "schemas" / "v0.3" / "conformance-claim.schema.json"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("claims", nargs="+", type=Path)
    args = parser.parse_args()

    schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    validator = Draft202012Validator(schema, format_checker=FormatChecker())
    errors: list[str] = []
    for claim_path in args.claims:
        try:
            claim = load_claim(claim_path)
        except (OSError, ValueError, yaml.YAMLError, json.JSONDecodeError) as error:
            errors.append(f"{claim_path}: {error}")
            continue
        for error in sorted(validator.iter_errors(claim), key=lambda item: list(item.absolute_path)):
            location = "/" + "/".join(str(part) for part in error.absolute_path)
            errors.append(f"{claim_path}:{location}: {error.message}")

    if errors:
        print("\n".join(errors), file=sys.stderr)
        return 1
    print(f"v0.3 conformance claims valid: {len(args.claims)}")
    return 0


def load_claim(path: Path) -> Any:
    text = path.read_text(encoding="utf-8")
    if path.suffix.lower() == ".json":
        return json.loads(text)
    return yaml.safe_load(text)


if __name__ == "__main__":
    raise SystemExit(main())
