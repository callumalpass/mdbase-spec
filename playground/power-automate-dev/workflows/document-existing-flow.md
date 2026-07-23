---
type: workflow
schemaVersion: 1
id: powerautomate_document_existing_flow
name: Document existing Flow
description: Fetch an existing flow definition and have an agent produce maintainable documentation.
enabled: true
materialization: materialized

vars:
  workingRoot: /home/calluma/projects/power-automate-agent-workspace

requires:
  capabilities:
    - pp.flow.read
    - pp.dataverse.read
    - agent.execute
    - record.write

triggers:
  - id: documentation_requested
    type: powerautomate.flowDocumentation.requested
    event: powerautomate.flowDocumentation.requested

steps:
  - id: flow
    type: pp.flow.getDefinition
    input:
      env: "{{event.payload.environmentAlias}}"
      flowId: "{{event.payload.flowId}}"

  - id: operation_catalog
    type: pp.flow.operationCatalog
    input:
      env: "{{event.payload.environmentAlias}}"
      usage: Action
      searchText: ""

  - id: document
    type: agent.run
    input:
      prompt: "[[powerautomate.documentExistingFlow]]"
      cwd:
        $expr: vars.workingRoot
      maxDuration: 1h
      writeTargets:
        - "{{event.payload.outputPath}}"
      payload:
        flowDefinition:
          $expr: steps.flow.output
        operationCatalog:
          $expr: steps.operation_catalog.output.operations
        outputPath: "{{event.payload.outputPath}}"

run:
  mode: sequential
  concurrency:
    group: "{{event.payload.flowId}}"
    policy: queue
  limits:
    timeout: 90m
  onError: stop
---

# Document Existing Flow

This workflow sketches a lower-risk adoption path: use the package to document and explain existing automations before allowing it to create or deploy anything.
