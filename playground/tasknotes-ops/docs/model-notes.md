---
type: note
title: Modeling Notes
---

# Modeling Notes

This playground separates four things that are tangled together in the current Tickle setup:

1. Schedule or file events decide when a workflow starts.
2. Actions define portable operation contracts.
3. Runtime instances implement supported actions such as `agent.run`.
4. Local scripts and shell commands are explicit `command.run` workflow steps.
5. Prompts are typed input resources passed to `agent.run`.

Current mdbase validation can check the basic record shapes and link existence. A future workflow validator would additionally check:

- trigger types against the event registry
- step types against the action registry
- step inputs against action `inputSchema`
- expression references against known `event`, `vars`, and prior `steps.*.output`
- required capabilities against policy
- whether the runtime supports every referenced action
