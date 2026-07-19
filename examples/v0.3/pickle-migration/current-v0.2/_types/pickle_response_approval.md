---
name: pickle_response_approval
description: Approve, reject, or request revision for a Pickle request.
display_name_key: decision
fields:
  id:
    type: string
    generated: ulid
    unique: true
  request:
    type: link
    target: pickle_request
    validate_exists: true
    required: true
  decision:
    type: enum
    values: [approve, reject, revise]
    required: true
  comment:
    type: string
  responded_at:
    type: datetime
    generated: now
  responder:
    type: string
  attachment_paths:
    type: list
    items:
      type: string
---
