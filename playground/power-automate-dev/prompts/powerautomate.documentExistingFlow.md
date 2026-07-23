---
type: prompt
id: powerautomate.documentExistingFlow
name: Document existing Flow
provider: powerautomate-dev
description: Turn an existing flow definition into maintainable documentation.
inputSchema:
  type: object
  required: [flowDefinition]
  fields:
    flowDefinition:
      type: any
    environmentContext:
      type: any
    operationCatalog:
      type: any
output:
  expectedArtifacts:
    - markdown_documentation
constraints:
  - Preserve exact trigger and action names.
  - Note dependencies on connection references, environment variables, and Dataverse tables.
---

# Document Existing Flow

Produce documentation explaining what a flow does, why, and what dependencies it has.
