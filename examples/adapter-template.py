#!/usr/bin/env python3
"""Minimal JSONL adapter template for scripts/mdbase-test.py.

Replace the TODO blocks with calls into your implementation.
The process handles one request and exits with status 0.
"""

import json
import sys
from typing import Any, Dict


def err(code: str, message: str) -> Dict[str, Any]:
    return {"valid": False, "error": {"code": code, "message": message}}


def handle_request(req: Dict[str, Any]) -> Dict[str, Any]:
    collection = req.get("collection")
    operation = req.get("operation")
    input_data = req.get("input") or {}
    simulate = req.get("simulate") or {}

    if not collection or not isinstance(collection, str):
        return err("invalid_request", "missing collection")
    if not operation or not isinstance(operation, str):
        return err("invalid_request", "missing operation")

    # TODO: initialize your implementation with the collection path.
    # impl = MyImpl(collection_root=collection)

    if operation == "load_config":
        # TODO: call your implementation and map output shape.
        return {"valid": True}

    if operation == "load_types":
        # TODO
        return {"valid": True}

    if operation == "get_type":
        # TODO
        type_name = input_data.get("type")
        if not type_name:
            return err("invalid_request", "input.type is required")
        return {"valid": True, "type": {"name": type_name}}

    if operation == "create_type":
        # TODO
        return {"valid": True, "path": "_types/example.md"}

    if operation == "read":
        # TODO
        return err("file_not_found", f"{input_data.get('path')} not found")

    if operation == "create":
        # TODO
        return {"valid": True, "path": input_data.get("path"), "frontmatter": input_data.get("frontmatter", {})}

    if operation == "update":
        # TODO
        return {"valid": True, "path": input_data.get("path"), "frontmatter": {}}

    if operation == "delete":
        # TODO
        return {"valid": True, "deleted": True}

    if operation == "rename":
        # TODO
        return {"valid": True, "old_path": input_data.get("path"), "new_path": input_data.get("new_path")}

    if operation == "validate":
        # TODO
        return {"valid": True, "issues": []}

    if operation == "query":
        # TODO: implement minimal subset for early levels, full behavior for level 3+.
        return {"valid": True, "results": [], "meta": {"total_count": 0, "has_more": False}}

    if operation == "evaluate":
        # TODO
        return {"valid": True, "result": None}

    if operation == "batch_update":
        # TODO
        return {"valid": True, "batch_result": {"total": 0, "succeeded": 0, "failed": 0}}

    if operation == "init":
        # TODO
        return {"valid": True}

    # Optional / higher-level operations can be added as you implement more levels.
    # parse_link, resolve_link, get_types, backfill, batch_delete, migrate, cache_rebuild, cache_clear, watch

    return err("invalid_request", f"unsupported operation: {operation}")


def main() -> int:
    try:
        raw = sys.stdin.read()
        req = json.loads(raw)
    except Exception as exc:
        print(json.dumps(err("invalid_request", f"invalid JSON input: {exc}")))
        return 0

    try:
        response = handle_request(req)
    except Exception as exc:
        response = err("invalid_request", str(exc))

    print(json.dumps(response))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
