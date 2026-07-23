---
type: prompt
id: powerautomate.designFlow
name: Design Power Automate flow
provider: powerautomate-dev
description: Draft a Power Automate definition from a typed request and live pp context.
inputSchema:
  type: object
  required: [request, environmentContext, operationCatalog]
  fields:
    request:
      type: any
    environmentContext:
      type: any
    operationCatalog:
      type: any
    existingFlows:
      type: any
output:
  expectedRecords:
    - flow_design
constraints:
  - Use only connector operations present in the supplied catalog unless explicitly marked as an assumption.
  - Prefer solution-aware connection references and environment variables.
  - Do not deploy or mutate the environment.
---

# Design Power Automate Flow

You are designing a Power Automate cloud flow from a typed request.

Produce a `flow_design` record with:

- a concise design summary
- trigger and action sequence
- candidate workflow definition JSON or a path to an artifact containing it
- connection references
- assumptions
- risks
- open questions

Use `pp` context as authoritative. If connector metadata or table metadata is missing, state the gap rather than inventing an operation.
