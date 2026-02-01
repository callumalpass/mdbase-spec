# Appendix A: Complete Examples

This appendix provides complete, working examples of collections and their components.

---

## A.1 Minimal Collection

The simplest valid collection:

```
minimal/
├── mdbase.yaml
└── hello.md
```

**mdbase.yaml:**
```yaml
spec_version: "0.1.0"
```

**hello.md:**
```markdown
---
title: Hello World
---

This is a minimal collection with one untyped file.
```

---

## A.2 Task Management Collection

A complete task management setup with types, queries, and examples.

### Structure

```
tasks-project/
├── mdbase.yaml
├── _types/
│   ├── meta.md
│   ├── base.md
│   ├── task.md
│   ├── person.md
│   └── urgent.md
├── people/
│   ├── alice.md
│   └── bob.md
├── tasks/
│   ├── feature-login.md
│   ├── bug-crash.md
│   └── subtasks/
│       └── login-ui.md
└── .mdbase/
    └── (cache files)
```

### Configuration

**mdbase.yaml:**
```yaml
spec_version: "0.1.0"

name: "Project Tasks"
description: "Task tracking for the main project"

settings:
  exclude:
    - ".git"
    - "node_modules"
    - ".mdbase"
    - "*.draft.md"
  
  default_validation: "warn"
  default_strict: false
  id_field: "id"
  rename_update_refs: true
  write_nulls: "omit"
```

### Type Definitions

**_types/meta.md:**
```markdown
---
name: meta
description: Schema for type definition files

match:
  path_glob: "_types/**/*.md"

strict: false

fields:
  name:
    type: string
    required: true
  fields:
    type: any
---
```

**_types/base.md:**
```markdown
---
name: base

fields:
  id:
    type: string
    required: true
    generated: ulid
  created_at:
    type: datetime
    generated: now
  updated_at:
    type: datetime
    generated: now_on_write
---

# Base Type

Common fields for all tracked entities. Provides automatic ID generation and timestamps.
```

**_types/task.md:**
```markdown
---
name: task
description: A task or todo item with lifecycle tracking
extends: base

match:
  path_glob: "tasks/**/*.md"

path_pattern: "{id}.md"

fields:
  title:
    type: string
    required: true
    min_length: 1
    max_length: 200
    description: Short, descriptive task title
  
  status:
    type: enum
    values: [open, in_progress, blocked, done, cancelled]
    default: open
    description: Current lifecycle state
  
  priority:
    type: integer
    min: 1
    max: 5
    default: 3
    description: "1 = lowest, 5 = highest"
  
  assignee:
    type: link
    target: person
    description: Person responsible for this task
  
  due_date:
    type: date
    description: When the task should be completed
  
  tags:
    type: list
    items:
      type: string
    default: []
    description: Categorization tags
  
  parent:
    type: link
    target: task
    description: Parent task (for subtasks)
  
  blocks:
    type: list
    items:
      type: link
      target: task
    default: []
    description: Tasks that this task blocks
  
  estimate_hours:
    type: number
    min: 0
    description: Estimated hours to complete
---

# Task

Tasks represent discrete units of work tracked through their lifecycle.

## Status Values

| Status | Description |
|--------|-------------|
| `open` | Not started |
| `in_progress` | Currently being worked on |
| `blocked` | Waiting on external dependency |
| `done` | Completed successfully |
| `cancelled` | Will not be done |

## Priority Scale

- **5**: Critical - drop everything
- **4**: High - do this week
- **3**: Medium - normal priority
- **2**: Low - when time permits
- **1**: Someday - nice to have

## Example

```yaml
---
type: task
title: Implement user authentication
status: in_progress
priority: 4
assignee: "[[alice]]"
due_date: 2024-04-01
tags: [feature, security]
estimate_hours: 16
---

## Requirements

- OAuth 2.0 support
- Remember me functionality
- Password reset flow
```
```

**_types/person.md:**
```markdown
---
name: person
description: A team member
extends: base

match:
  path_glob: "people/**/*.md"

fields:
  name:
    type: string
    required: true
    description: Full name
  
  email:
    type: string
    description: Email address
  
  team:
    type: string
    description: Team or department
  
  role:
    type: string
    description: Job title or role
  
  active:
    type: boolean
    default: true
    description: Whether currently on the team
---

# Person

Team member records for assignment and reference.
```

**_types/urgent.md:**
```markdown
---
name: urgent
description: Marks items requiring immediate attention

match:
  where:
    tags:
      contains: "urgent"

fields:
  escalation_contact:
    type: string
    description: Who to contact for escalation
  
  sla_hours:
    type: integer
    description: Hours until SLA breach
---

# Urgent

Items tagged "urgent" automatically get this type applied.
This enables additional tracking fields for urgent items.
```

### Sample Files

**people/alice.md:**
```markdown
---
type: person
id: alice
name: Alice Chen
email: alice@example.com
team: engineering
role: Senior Developer
active: true
---

Alice is the tech lead for the backend team.

## Expertise
- Authentication systems
- API design
- Performance optimization
```

**tasks/feature-login.md:**
```markdown
---
type: task
id: feature-login
title: Implement user login system
status: in_progress
priority: 4
assignee: "[[alice]]"
due_date: 2024-04-01
tags: [feature, security, auth]
estimate_hours: 24
---

# Login System Implementation

## Overview

Build complete authentication system with OAuth support.

## Subtasks

- [[subtasks/login-ui]] - Frontend components
- Database schema design
- API endpoints
- Testing
```

**tasks/bug-crash.md:**
```markdown
---
types: [task, urgent]
id: bug-crash
title: Fix crash on startup
status: open
priority: 5
assignee: "[[bob]]"
tags: [bug, urgent, production]
escalation_contact: alice@example.com
sla_hours: 4
---

# Critical: App Crashes on Startup

## Symptoms

App crashes immediately when user opens it.

## Impact

100% of users affected.

## Workaround

None known.
```

---

## A.3 Query Examples

### Core Examples

#### All Open Tasks

```yaml
query:
  types: [task]
  where: 'status == "open"'
  order_by:
    - field: priority
      direction: desc
```

#### My Tasks (Assigned to Alice)

```yaml
query:
  types: [task]
  where:
    and:
      - 'assignee.asFile().id == "alice"'
      - 'status != "done"'
  order_by:
    - field: due_date
      direction: asc
```

#### Tasks Due This Week

```yaml
query:
  types: [task]
  where:
    and:
      - "due_date >= today()"
      - "due_date <= today() + '7d'"
      - 'status != "done"'
  order_by:
    - field: due_date
      direction: asc
```

#### High Priority Blockers

```yaml
query:
  types: [task]
  where:
    and:
      - "priority >= 4"
      - 'status == "blocked"'
```

#### Urgent Items (Multi-Type)

```yaml
query:
  where: 'types.contains("urgent")'
  order_by:
    - field: sla_hours
      direction: asc
```

### Query+ Examples

#### Overdue Tasks (Query+)

```yaml
query:
  types: [task]
  where:
    and:
      - "due_date < today()"
      - 'status != "done"'
      - 'status != "cancelled"'
  formulas:
    days_overdue: "(today() - due_date) / 86400000"  # date subtraction returns milliseconds
  order_by:
    - field: formula.days_overdue
      direction: desc
```

#### Workload by Person (Query+)

```yaml
query:
  types: [task]
  where: 'status != "done" && exists(assignee)'
  formulas:
    assignee_name: "assignee.asFile().name"
```

To group by assignee (Query+):
```yaml
query:
  types: [task]
  where: 'status != "done" && exists(assignee)'
  formulas:
    assignee_name: "assignee.asFile().name"
  groupBy:
    property: formula.assignee_name
    direction: ASC
  property_summaries:
    estimate_hours: Sum
```

---

## A.4 Knowledge Base Collection

A personal wiki / knowledge base setup.

### Structure

```
knowledge-base/
├── mdbase.yaml
├── _types/
│   ├── document.md
│   ├── concept.md
│   ├── source.md
│   └── daily.md
├── concepts/
│   ├── machine-learning.md
│   └── distributed-systems.md
├── sources/
│   └── attention-paper.md
├── daily/
│   └── 2024/
│       └── 03/
│           └── 15.md
└── inbox/
    └── random-thought.md
```

### Types

**_types/document.md:**
```markdown
---
name: document
description: General note or document

match:
  path_glob: "**/*.md"

fields:
  title:
    type: string
  tags:
    type: list
    items:
      type: string
    default: []
  related:
    type: list
    items:
      type: link
    default: []
---

# Document

Base type for all notes. Matched by default for any markdown file.
```

**_types/concept.md:**
```markdown
---
name: concept
description: A concept or topic being studied
extends: document

match:
  path_glob: "concepts/**/*.md"

fields:
  aliases:
    type: list
    items:
      type: string
    default: []
    description: Alternative names for this concept
  
  status:
    type: enum
    values: [stub, developing, mature]
    default: stub
  
  sources:
    type: list
    items:
      type: link
      target: source
    default: []
---

# Concept

Represents a topic or idea being studied. Evolves from stub to mature.
```

**_types/daily.md:**
```markdown
---
name: daily
description: Daily journal entry
extends: document

match:
  path_glob: "daily/**/*.md"

path_pattern: "{date}.md"

fields:
  date:
    type: date
    required: true
  
  mood:
    type: enum
    values: [great, good, okay, rough, bad]
  
  highlights:
    type: list
    items:
      type: string
    default: []
---

# Daily Note

Journal entries organized by date.
```

---

## A.5 CLI Workflow Example

```bash
# Initialize a new collection
mkdir my-project && cd my-project
mdbase init
# Creates mdbase.yaml, _types/, and _types/meta.md

# Create a type
mdbase type create task

# Create a task
mdbase create task \
  --field title="Build the thing" \
  --field priority=4

# List all tasks
mdbase query --type task

# Find overdue tasks
mdbase query --type task --where 'due_date < today() && status != "done"'

# Update a task
mdbase update tasks/01ABC.md --field status=done

# Rename with reference updates
mdbase rename tasks/old-name.md tasks/new-name.md

# Validate the collection
mdbase validate

# Rebuild cache
mdbase cache rebuild
```
