---
type: event
id: ops.github.dirtyIssuesFound
name: Dirty GitHub issues found
provider: ops
payloadSchema:
  type: object
  required: [repository, missingIssues, updatedIssues, duplicateIssues]
  fields:
    repository:
      type: string
    missingIssues:
      type: list
      items:
        type: object
        fields:
          number:
            type: integer
          remoteTitle:
            type: string
    updatedIssues:
      type: list
      items:
        type: integer
    duplicateIssues:
      type: list
      items:
        type: integer
---

# Dirty GitHub Issues Found

Emitted when `.ops` needs issue triage because remote issue state is missing, dirty, or duplicated locally.
