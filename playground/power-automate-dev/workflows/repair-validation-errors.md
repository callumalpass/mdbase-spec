---
type: workflow
schemaVersion: 1
id: powerautomate_repair_validation_errors
name: Repair validation errors
description: Use validation output and pp metadata to repair a failed flow design.
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
  - id: validation_failed
    type: powerautomate.flowValidation.failed
    event: powerautomate.flowValidation.failed

steps:
  - id: operation_catalog
    type: pp.flow.operationCatalog
    input:
      env: "{{event.payload.environmentAlias}}"
      usage: Action
      searchText: ""
      includeTags: [Action, Important]
      excludeTags: [Deprecated, Agentic]

  - id: repair
    type: agent.run
    input:
      prompt: "[[powerautomate.repairValidation]]"
      cwd:
        $expr: vars.workingRoot
      maxDuration: 2h
      writeTargets:
        - "{{event.payload.designPath}}"
      payload:
        designPath: "{{event.payload.designPath}}"
        validationPath: "{{event.payload.validationPath}}"
        validation:
          errors:
            $expr: event.payload.errors
          errorCount:
            $expr: event.payload.errorCount
        operationCatalog:
          $expr: steps.operation_catalog.output.operations

  - id: save_repaired_design
    type: mdbase.record.upsert
    input:
      path: "{{event.payload.designPath}}"
      mode: update
      frontmatter:
        status: draft
        definition:
          $expr: steps.repair.output.records.flow_design.definition
        connectionReferences:
          $expr: steps.repair.output.records.flow_design.connectionReferences
        assumptions:
          $expr: steps.repair.output.records.flow_design.assumptions
        risks:
          $expr: steps.repair.output.records.flow_design.risks
      body:
        $expr: steps.repair.output.records.flow_design.body

  - id: validate_repair
    type: pp.flow.validate
    input:
      env: "{{event.payload.environmentAlias}}"
      flowId:
        $expr: vars.validationFlowId
      displayName:
        $expr: steps.repair.output.records.flow_design.flowDisplayName
      definition:
        $expr: steps.repair.output.records.flow_design.definition
      connectionReferences:
        $expr: steps.repair.output.records.flow_design.connectionReferences

  - id: save_validation
    type: mdbase.record.upsert
    input:
      path: "{{event.payload.validationPath}}"
      mode: update
      frontmatter:
        status:
          $expr: steps.validate_repair.output.status
        errorCount:
          $expr: steps.validate_repair.output.errorCount
        warningCount:
          $expr: steps.validate_repair.output.warningCount
        errors:
          $expr: steps.validate_repair.output.errors
        warnings:
          $expr: steps.validate_repair.output.warnings

run:
  mode: sequential
  concurrency:
    group: "{{event.payload.designId}}"
    policy: queue
  limits:
    timeout: 3h
  onError: stop
---

# Repair Validation Errors

This shows where an agent loop adds value: the deterministic runtime supplies precise validation errors and connector metadata, while the agent proposes the smallest repair.
