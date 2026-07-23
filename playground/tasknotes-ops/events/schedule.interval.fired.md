---
type: event
id: schedule.interval.fired
name: Interval fired
provider: mdbase
payloadSchema:
  type: object
  required: [scheduledAt, actualAt, workflowId, triggerId]
  fields:
    scheduledAt:
      type: datetime
    actualAt:
      type: datetime
    workflowId:
      type: string
    triggerId:
      type: string
    missedRuns:
      type: integer
      default: 0
---

# Interval Fired

Emitted by a scheduler when an interval trigger is due.
