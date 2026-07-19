---
type: provider
id: mdbase
version: 1
provider_version: 0.3.0-alpha.1
name: mdbase core runtime
description: Core mdbase record and collection runtime contracts.

contracts:
  actions:
    - mdbase.record.patch
  events:
    - mdbase.record.modified
  capabilities:
    - mdbase.record.write
---

# mdbase core runtime

This provider record materializes core mdbase runtime contracts for inspection.
