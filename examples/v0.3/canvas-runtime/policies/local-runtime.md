---
type: runtime_policy
id: local.canvas-runtime.policy
version: 1
name: Local canvas runtime policy
enabled: true

executors:
  default: obsidian
  workflows:
    canvas.zone.set-status: obsidian

capabilities:
  mdbase.record.write:
    mode: allow
    max_files_per_run: 1

limits:
  workflow_timeout: 30s
  max_concurrent_runs: 4
---

# Local canvas runtime policy

This policy allows the local canvas runtime to patch one record per drop event.
