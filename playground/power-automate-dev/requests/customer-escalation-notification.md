---
type: flow_request
id: req_customer_escalation_notification
title: Customer escalation notification flow
environmentAlias: dev
solutionName: CustomerOperations
owner: callum
status: ready
tables:
  - incident
  - account
  - systemuser
connectors:
  - shared_commondataserviceforapps
  - shared_teams
acceptanceCriteria:
  - When an active case is marked as escalated, notify the account owner in Teams.
  - Include case title, account name, priority, and a link to the model-driven app record.
  - Do not send notifications for resolved or cancelled cases.
  - Avoid duplicate notifications when unrelated fields change.
constraints:
  target: cloud_flow
  trigger: Dataverse row modified
  preferredOwner: service_account
  deploymentRequiresApproval: true
---

# Customer Escalation Notification Flow

Build a cloud flow that watches Dataverse cases and notifies the account owner when a case enters an escalated state.

The first prototype should be conservative: validate the trigger filter and message construction before attempting deployment.
