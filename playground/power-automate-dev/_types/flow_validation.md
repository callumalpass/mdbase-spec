---
name: flow_validation
description: Flow service validation result
display_name_key: title
match:
  path_glob: "validations/**/*.md"
strict: "warn"
fields:
  id:
    type: string
    required: true
    unique: true
  design:
    type: link
    target: flow_design
    validate_exists: true
    required: true
  title:
    type: string
    required: true
  status:
    type: enum
    values: [passed, failed, warning, unknown]
    required: true
  checkedAt:
    type: datetime
  errorCount:
    type: integer
    default: 0
  warningCount:
    type: integer
    default: 0
  summary:
    type: string
  errors:
    type: any
  warnings:
    type: any
---

# Flow Validation

Captured output from Power Automate validation endpoints.
