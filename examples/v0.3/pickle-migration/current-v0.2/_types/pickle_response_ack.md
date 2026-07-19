---
name: pickle_response_ack
description: Acknowledge that a Pickle message was read.
display_name_key: message
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
  message:
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
