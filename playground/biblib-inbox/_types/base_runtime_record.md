---
name: base_runtime_record
description: Shared fields for runtime profile records
strict: "warn"
fields:
  id:
    type: string
    required: true
    unique: true
  name:
    type: string
  description:
    type: string
  version:
    type: integer
    default: 1
  provider:
    type: string
  enabled:
    type: boolean
    default: true
---

# Base Runtime Record

Common fields used by action, event, workflow, prompt, policy, and capability records.
