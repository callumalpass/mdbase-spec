---
type: runtime_policy
id: local_power_automate_dev
name: Local Power Automate development policy
runtime: local-mdbase-runtime
description: Example local policy for the Power Automate agent package.

grants:
  - capability: pp.dataverse.read
    to: workflow:powerautomate_develop_flow_from_request
  - capability: pp.flow.read
    to: workflow:powerautomate_develop_flow_from_request
  - capability: pp.flow.validate.execute
    to: workflow:powerautomate_develop_flow_from_request
  - capability: record.write
    to: workflow:powerautomate_develop_flow_from_request
  - capability: agent.execute
    to: workflow:powerautomate_develop_flow_from_request

  - capability: pp.dataverse.read
    to: workflow:powerautomate_repair_validation_errors
  - capability: pp.flow.read
    to: workflow:powerautomate_repair_validation_errors
  - capability: pp.flow.validate.execute
    to: workflow:powerautomate_repair_validation_errors
  - capability: record.write
    to: workflow:powerautomate_repair_validation_errors
  - capability: agent.execute
    to: workflow:powerautomate_repair_validation_errors

  - capability: record.write
    to: workflow:powerautomate_request_approval_for_valid_flow
  - capability: agent.execute
    to: workflow:powerautomate_request_approval_for_valid_flow
  - capability: approval.request.create
    to: workflow:powerautomate_request_approval_for_valid_flow

  - capability: pp.flow.validate.execute
    to: workflow:powerautomate_deploy_approved_flow
  - capability: pp.flow.write
    to: workflow:powerautomate_deploy_approved_flow
  - capability: pp.solution.export.execute
    to: workflow:powerautomate_deploy_approved_flow
  - capability: record.write
    to: workflow:powerautomate_deploy_approved_flow

  - capability: pp.flow.read
    to: workflow:powerautomate_document_existing_flow
  - capability: pp.dataverse.read
    to: workflow:powerautomate_document_existing_flow
  - capability: agent.execute
    to: workflow:powerautomate_document_existing_flow
  - capability: record.write
    to: workflow:powerautomate_document_existing_flow

denies:
  - capability: pp.solution.import.execute
    to: "*"
---

# Local Power Automate Development Policy

This policy intentionally grants `pp.flow.write` only to the approval-triggered deployment workflow and denies solution import globally.

It is illustrative, not a complete sandbox or tenant governance model.
