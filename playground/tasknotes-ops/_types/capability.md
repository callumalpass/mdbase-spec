---
name: capability
description: Runtime permission or risk atom
extends: base_runtime_record
display_name_key: id
match:
  path_glob: "capabilities/**/*.md"
strict: "warn"
fields:
  category:
    type: enum
    values: [record, file, workflow, approval, agent, command, network, github, ops, secret]
  risk:
    type: enum
    values: [low, medium, high]
    default: low
---

# Capability

A capability names a permission or risk that actions can require and policies can grant.
