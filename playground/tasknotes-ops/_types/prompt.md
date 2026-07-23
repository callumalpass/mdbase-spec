---
name: prompt
description: Prompt resource passed as input to agent actions
extends: base_runtime_record
display_name_key: id
match:
  path_glob: "prompts/**/*.md"
strict: "warn"
fields:
  inputSchema:
    type: any
  context:
    type: any
  output:
    type: any
  constraints:
    type: any
---

# Prompt

A prompt is a typed resource consumed by actions such as `agent.run`.
