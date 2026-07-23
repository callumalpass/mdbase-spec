---
type: workflow
schemaVersion: 1
id: powerautomate_develop_flow_from_request
name: Develop Flow from request
description: Turn a ready flow request into a draft design and first validation result.
enabled: true
materialization: materialized

vars:
  workingRoot: /home/calluma/projects/power-automate-agent-workspace
  validationFlowId: 00000000-0000-0000-0000-000000000000

requires:
  capabilities:
    - pp.dataverse.read
    - pp.flow.read
    - pp.flow.validate.execute
    - record.write
    - agent.execute

triggers:
  - id: request_ready
    type: powerautomate.flowRequest.created
    event: powerautomate.flowRequest.created
    path:
      glob: "requests/**/*.md"

conditions:
  - $expr: 'event.payload.status == "ready"'

steps:
  - id: table_metadata
    type: pp.dv.query
    input:
      env: "{{event.payload.environmentAlias}}"
      path: /EntityDefinitions
      query:
        "$select": LogicalName,EntitySetName,DisplayName
        "$top": "250"
      jq: "{ tables: .value }"

  - id: operation_catalog
    type: pp.flow.operationCatalog
    input:
      env: "{{event.payload.environmentAlias}}"
      usage: Action
      searchText: ""
      includeTags: [Action, Important]
      excludeTags: [Deprecated, Agentic]

  - id: draft_design
    type: agent.run
    input:
      prompt: "[[powerautomate.designFlow]]"
      cwd:
        $expr: vars.workingRoot
      maxDuration: 2h
      writeTargets:
        - "designs/{{event.payload.requestId}}.design.md"
      payload:
        requestPath: "{{event.payload.path}}"
        requestId: "{{event.payload.requestId}}"
        environmentAlias: "{{event.payload.environmentAlias}}"
        solutionName: "{{event.payload.solutionName}}"
        environmentContext:
          $expr: steps.table_metadata.output.selected
        operationCatalog:
          $expr: steps.operation_catalog.output.operations

  - id: save_design
    type: mdbase.record.upsert
    input:
      path: "designs/{{event.payload.requestId}}.design.md"
      mode: upsert
      frontmatter:
        type: flow_design
        id: "design_{{event.payload.requestId}}"
        request: "{{event.payload.path}}"
        title: "Design for {{event.payload.requestId}}"
        environmentAlias: "{{event.payload.environmentAlias}}"
        flowDisplayName:
          $expr: steps.draft_design.output.records.flow_design.flowDisplayName
        status: draft
        definition:
          $expr: steps.draft_design.output.records.flow_design.definition
        connectionReferences:
          $expr: steps.draft_design.output.records.flow_design.connectionReferences
        assumptions:
          $expr: steps.draft_design.output.records.flow_design.assumptions
        risks:
          $expr: steps.draft_design.output.records.flow_design.risks
      body:
        $expr: steps.draft_design.output.records.flow_design.body

  - id: validate
    type: pp.flow.validate
    input:
      env: "{{event.payload.environmentAlias}}"
      flowId:
        $expr: vars.validationFlowId
      displayName:
        $expr: steps.draft_design.output.records.flow_design.flowDisplayName
      definition:
        $expr: steps.draft_design.output.records.flow_design.definition
      connectionReferences:
        $expr: steps.draft_design.output.records.flow_design.connectionReferences

  - id: save_validation
    type: mdbase.record.upsert
    input:
      path: "validations/{{event.payload.requestId}}.validation.md"
      mode: upsert
      frontmatter:
        type: flow_validation
        id: "validation_{{event.payload.requestId}}"
        design: "designs/{{event.payload.requestId}}.design.md"
        title: "Validation for {{event.payload.requestId}}"
        status:
          $expr: steps.validate.output.status
        errorCount:
          $expr: steps.validate.output.errorCount
        warningCount:
          $expr: steps.validate.output.warningCount
        errors:
          $expr: steps.validate.output.errors
        warnings:
          $expr: steps.validate.output.warnings
      body: |
        First validation result captured by the runtime.

run:
  mode: sequential
  concurrency:
    group: "{{event.payload.requestId}}"
    policy: skip
  limits:
    timeout: 3h
  onError: stop
---

# Develop Flow From Request

This workflow is the package's main "agent" story: a typed request becomes a flow design, the design is checked against live Power Automate validation, and the result is written back as durable mdbase records.
