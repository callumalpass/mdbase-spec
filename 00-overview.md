# 00. Overview

## Abstract

mdbase v0.3 defines a protocol for treating a folder of Markdown files as a typed,
queryable, link-aware data collection.

The v0.3 design has four layers:

1. Markdown records provide durable, human-readable storage.
2. JSON Schema validates persisted YAML frontmatter shape.
3. mdbase collection semantics define behavior JSON Schema cannot know:
   matching, links, effective read defaults, uniqueness, paths, operations, and
   watches.
4. Runtime contracts define optional active behavior: providers, events,
   workflows, actions, capabilities, policies, runs, and checkpoints.

This replaces the v0.2.x custom field grammar with a narrower wrapper around
JSON Schema plus explicit mdbase sections.

## One-Sentence Model

JSON Schema answers "is this frontmatter object shaped correctly"; mdbase
answers "what does this Markdown file mean inside this collection"; runtimes
answer "what behavior should happen when events occur."

## Motivation

Markdown plus YAML frontmatter is already used as a lightweight database by
static site generators, Obsidian vaults, agent workspaces, documentation
systems, and personal knowledge tools. The problem is not storage. The problem
is that every tool reconstructs structure and behavior differently.

Earlier mdbase drafts solved this by defining a custom field grammar in
Markdown type files. That gave mdbase a compact authoring syntax, but it also
made mdbase a schema language, a collection policy language, and a mutation
policy language at the same time.

v0.3 makes the boundary sharper:

- use existing JSON Schema tooling for record shape
- keep mdbase-specific semantics visible outside the schema
- move mutation behavior into lifecycle and runtime contracts
- standardize expressions on CEL
- keep Markdown files as the authoring and documentation surface

## What v0.3 Defines

v0.3 defines:

- how a collection is discovered and scanned
- how Markdown records are parsed
- how type files wrap JSON Schema
- how files match types
- how records are validated
- how links are parsed and resolved
- how queries evaluate records
- how create, update, delete, rename, and batch operations behave
- how lifecycle policy materializes managed values
- how portable expressions are written in CEL
- how runtime contracts describe providers, events, actions, capabilities,
  policies, and workflows
- how conformance profiles can be claimed independently

## What v0.3 Does Not Define

v0.3 does not require every tool to implement every layer.

Read-only tools can load collections, validate records, resolve links, and run
queries without supporting mutation or workflows.

Write-capable tools can implement lifecycle policy without becoming workflow
engines.

Workflow runtimes can execute declared behavior, but action implementations,
sandboxing, scheduling, agent orchestration, network access, and provider APIs
remain runtime responsibilities.

v0.3 is not an OpenAPI dialect. JSON Schema is used for data shape, not for
describing HTTP services.

## Design Principles

**Files are the source of truth.** Persistent user intent lives in text files.
Indexes, caches, run queues, and derived databases are disposable unless the
runtime explicitly materializes them as records.

**Use standard shape tooling.** A frontmatter schema should be understandable by
JSON Schema validators, editors, language servers, generators, and codegen
tools.

**Keep collection semantics explicit.** Links, uniqueness, matching, paths,
read defaults, and lifecycle behavior are not JSON Schema validation. They have
their own named sections.

**Mutation is runtime behavior.** Generated values, timestamp updates,
cross-record effects, and workflow actions happen during operations or runtime
execution. They are not hidden inside field definitions.

**Markdown stays inspectable.** Type files, workflow files, action contracts,
event contracts, policy records, run records, and checkpoint records can all be
ordinary Markdown files with YAML frontmatter and explanatory body text.

**Conformance is layered.** A simple validator should not need to implement a
workflow engine. A workflow runtime should still share the same record and
contract model.

## Major Changes From v0.2.x

| v0.2.x concept | v0.3 destination |
| --- | --- |
| `fields` grammar | JSON Schema under `schema.value` |
| per-field `required` | JSON Schema root `required` |
| enum `values` | JSON Schema `enum` |
| `strict` | JSON Schema `additionalProperties` |
| field `default` | JSON Schema `default` annotation plus `collection.read_defaults` when effective reads are desired |
| `type: link` | string/array schema plus `collection.links` |
| `unique` | `collection.unique` |
| `generated` | `lifecycle` |
| `computed` | query projection, collection projection, or runtime workflow |
| custom expression language | mdbase CEL profile |
| constraint merging | validate all matched schemas |
| generated behavior inside type shape | lifecycle or runtime policy |
| action/event shape in custom fields | JSON Schema contracts in runtime records |

## Normative Language

The keywords `MUST`, `MUST NOT`, `SHOULD`, `SHOULD NOT`, and `MAY` are to be
interpreted as described in RFC 2119.

Draft notes use ordinary prose and are not normative.
