---
type: prompt
id: powerautomate.repairValidation
name: Repair Flow validation errors
provider: powerautomate-dev
description: Repair a candidate flow definition using Flow validation errors and pp metadata.
inputSchema:
  type: object
  required: [design, validation]
  fields:
    design:
      type: any
    validation:
      type: any
    operationCatalog:
      type: any
    environmentContext:
      type: any
output:
  expectedRecords:
    - flow_design
    - flow_validation
constraints:
  - Preserve the original business intent.
  - Make the smallest viable repair.
  - Explain each validation error and how it was addressed.
---

# Repair Flow Validation

Revise the `flow_design` so it can pass Power Automate validation. Use validation output and connector metadata as the source of truth.
