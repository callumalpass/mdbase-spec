---
type: workflow
schemaVersion: 1
id: powerautomate_request_approval_for_valid_flow
name: Request approval for valid Flow
description: Prepare a deployment plan and request human approval after validation passes.
enabled: true
materialization: materialized

vars:
  workingRoot: /home/calluma/projects/power-automate-agent-workspace

requires:
  capabilities:
    - record.write
    - agent.execute
    - approval.request.create

triggers:
  - id: validation_passed
    type: powerautomate.flowValidation.passed
    event: powerautomate.flowValidation.passed

steps:
  - id: review
    type: agent.run
    input:
      prompt: "[[powerautomate.reviewDeployment]]"
      cwd:
        $expr: vars.workingRoot
      maxDuration: 1h
      writeTargets:
        - "deployment-plans/{{event.payload.designId}}.deployment.md"
      payload:
        designPath: "{{event.payload.designPath}}"
        validationPath: "{{event.payload.validationPath}}"
        environmentAlias: "{{event.payload.environmentAlias}}"
        warningCount:
          $expr: event.payload.warningCount

  - id: save_plan
    type: mdbase.record.upsert
    input:
      path: "deployment-plans/{{event.payload.designId}}.deployment.md"
      mode: upsert
      frontmatter:
        type: deployment_plan
        id: "deployment_{{event.payload.designId}}"
        design: "{{event.payload.designPath}}"
        validation: "{{event.payload.validationPath}}"
        title: "Deploy {{event.payload.designId}}"
        targetEnvironment: "{{event.payload.environmentAlias}}"
        status: approval_requested
        steps:
          $expr: steps.review.output.records.deployment_plan.steps
        rollbackPlan:
          $expr: steps.review.output.records.deployment_plan.rollbackPlan
      body:
        $expr: steps.review.output.records.deployment_plan.body

  - id: approval
    type: approval.request
    input:
      title: "Approve Power Automate deployment for {{event.payload.designId}}"
      question: "Deploy the validated Power Automate flow design?"
      relatedRecords:
        - "{{event.payload.designPath}}"
        - "{{event.payload.validationPath}}"
        - "deployment-plans/{{event.payload.designId}}.deployment.md"
      details:
        designId: "{{event.payload.designId}}"
        environmentAlias: "{{event.payload.environmentAlias}}"
        warningCount:
          $expr: event.payload.warningCount
      responseSchema:
        type: object
        required: [approved]
        fields:
          approved:
            type: boolean
          targetEnvironment:
            type: string
          notes:
            type: string

run:
  mode: sequential
  concurrency:
    group: "{{event.payload.designId}}"
    policy: skip
  limits:
    timeout: 2h
  onError: stop
---

# Request Approval For Valid Flow

This workflow demonstrates why the package is more than a skill: validation state, deployment intent, and the approval request are durable records rather than transient chat context.
