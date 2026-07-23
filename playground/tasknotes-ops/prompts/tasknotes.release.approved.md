---
type: prompt
id: tasknotes.release.approved
name: TaskNotes approved release
provider: tasknotes
inputSchema:
  type: object
  required: [approval]
  fields:
    approval:
      type: object
context:
  include:
    - kind: file
      path: AGENTS.md
    - kind: file
      path: I18N_GUIDE.md
    - kind: file
      path: docs/releases/unreleased.md
    - kind: triggerPayload
output:
  mode: markdown
  artifacts:
    - agent-final-message.md
constraints:
  maxDuration: 6h
---

# TaskNotes Approved Release

Prepare and publish the approved TaskNotes release.

## Required Behavior

1. Read the approval response before acting.
2. Use the approved version unless the current repo state clearly requires a different semantic version.
3. Follow the repository release process exactly.
4. Run the i18n process, tests, linting, build, and Obsidian reload checks required by the repo.
5. Move unreleased release notes into the versioned release file.
6. Update `manifest.json` and `package.json`.
7. Commit, tag, and push only if the approval grants that public action.
