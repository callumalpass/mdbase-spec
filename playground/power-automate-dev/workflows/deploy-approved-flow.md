---
type: workflow
schemaVersion: 1
id: powerautomate_deploy_approved_flow
name: Deploy approved Flow
description: Revalidate and deploy a flow only after a human approval event.
enabled: true
materialization: materialized

vars:
  validationFlowId: 00000000-0000-0000-0000-000000000000
  artifactRoot: artifacts/power-automate

requires:
  capabilities:
    - pp.flow.validate.execute
    - pp.flow.write
    - pp.solution.export.execute
    - record.write

triggers:
  - id: approval_granted
    type: approval.granted
    event: approval.granted

conditions:
  - $expr: 'event.payload.response.package == "power-automate-dev" || event.payload.response.package == null'

steps:
  - id: final_validate
    type: pp.flow.validate
    input:
      env:
        $expr: event.payload.response.targetEnvironment
      flowId:
        $expr: vars.validationFlowId
      displayName:
        $expr: event.payload.response.flowDisplayName
      definition:
        $expr: event.payload.response.definition
      connectionReferences:
        $expr: event.payload.response.connectionReferences

  - id: export_before
    type: pp.solution.export
    if:
      $expr: event.payload.response.solutionName != null
    input:
      env:
        $expr: event.payload.response.targetEnvironment
      solutionName:
        $expr: event.payload.response.solutionName
      outputPath:
        $expr: vars.artifactRoot + "/" + event.payload.requestId + "-before.zip"
      managed: false

  - id: upsert_flow
    type: pp.flow.upsert
    if:
      $expr: steps.final_validate.output.status == "passed" || steps.final_validate.output.status == "warning"
    input:
      env:
        $expr: event.payload.response.targetEnvironment
      flowId:
        $expr: event.payload.response.flowId
      displayName:
        $expr: event.payload.response.flowDisplayName
      definition:
        $expr: event.payload.response.definition
      connectionReferences:
        $expr: event.payload.response.connectionReferences
      solutionName:
        $expr: event.payload.response.solutionName
      dryRun: false

  - id: mark_plan_deployed
    type: mdbase.record.upsert
    if:
      $expr: steps.upsert_flow.status == "succeeded"
    input:
      path:
        $expr: event.payload.response.deploymentPlanPath
      mode: update
      frontmatter:
        status: deployed
        approvalRequest:
          $expr: event.payload.requestId

run:
  mode: sequential
  concurrency:
    group:
      $expr: event.payload.requestId
    policy: skip
  limits:
    timeout: 2h
  onError: stop
---

# Deploy Approved Flow

This is intentionally approval-triggered. High-risk `pp.flow.write` and solution export capabilities are granted only to this workflow in the sample policy.
