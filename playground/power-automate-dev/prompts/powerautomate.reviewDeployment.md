---
type: prompt
id: powerautomate.reviewDeployment
name: Review deployment plan
provider: powerautomate-dev
description: Prepare a human-readable deployment review for an approved flow candidate.
inputSchema:
  type: object
  required: [design, validation]
  fields:
    design:
      type: any
    validation:
      type: any
    request:
      type: any
output:
  expectedRecords:
    - deployment_plan
constraints:
  - Highlight environment, solution, connection, and DLP risks.
  - Include rollback and verification steps.
  - Do not request deployment if validation failed.
---

# Review Deployment Plan

Create a deployment plan suitable for human approval.
