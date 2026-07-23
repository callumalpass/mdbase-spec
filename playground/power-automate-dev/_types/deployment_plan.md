---
name: deployment_plan
description: Approval-gated deployment plan for a Power Automate flow
display_name_key: title
match:
  path_glob: "deployment-plans/**/*.md"
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
  validation:
    type: link
    target: flow_validation
    validate_exists: true
  title:
    type: string
    required: true
  targetEnvironment:
    type: string
    required: true
  solutionName:
    type: string
  status:
    type: enum
    values: [draft, approval_requested, approved, deployed, cancelled, blocked]
    default: draft
  approvalRequest:
    type: string
  steps:
    type: list
    items:
      type: string
  rollbackPlan:
    type: list
    items:
      type: string
---

# Deployment Plan

Human-reviewable plan for deploying or updating a flow.
