---
name: task
description: A task managed by TaskNotes for Obsidian.
display_name_key: title
strict: false

path_pattern: "TaskNotes/Tasks/{title}.md"

match:
  fields_present: [title]

fields:
  title:
    type: string
    required: true
    tn_role: title
  status:
    type: enum
    required: true
    values: [open, in-progress, done, cancelled]
    default: open
    tn_role: status
    tn_completed_values: [done, cancelled]
  priority:
    type: enum
    values: [low, normal, high, urgent]
    default: normal
    tn_role: priority
  due:
    type: date
    tn_role: due
  scheduled:
    type: date
    tn_role: scheduled
  completedDate:
    type: date
    tn_role: completedDate
  tags:
    type: list
    items:
      type: string
    tn_role: tags
  contexts:
    type: list
    items:
      type: string
    tn_role: contexts
  projects:
    type: list
    items:
      type: link
    description: "Wikilinks to related project notes."
    tn_role: projects
  timeEstimate:
    type: integer
    min: 0
    description: "Estimated time in minutes."
    tn_role: timeEstimate
  dateCreated:
    type: datetime
    required: true
    generated: "now"
    tn_role: dateCreated
  dateModified:
    type: datetime
    generated: "now_on_write"
    tn_role: dateModified
  recurrence:
    type: string
    tn_role: recurrence
  recurrenceAnchor:
    type: enum
    values: [scheduled, completion]
    default: scheduled
    tn_role: recurrenceAnchor
  recurrenceParent:
    type: link
    tn_role: recurrenceParent
  occurrenceDate:
    type: date
    tn_role: occurrenceDate
  completeInstances:
    type: list
    items:
      type: date
    tn_role: completeInstances
  skippedInstances:
    type: list
    items:
      type: date
    tn_role: skippedInstances
  timeEntries:
    type: list
    tn_role: timeEntries
    items:
      type: object
      fields:
        startTime:
          type: datetime
        endTime:
          type: datetime
        description:
          type: string
        duration:
          type: integer
  blockedBy:
    type: list
    tn_role: blockedBy
    items:
      type: object
      fields:
        uid:
          type: link
        reltype:
          type: string
        gap:
          type: string
---

# Task

Generated from TaskNotes settings using the v0.2 custom field grammar.

