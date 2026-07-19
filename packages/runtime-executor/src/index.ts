import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  RuntimeContractValidator,
  type RuntimeDiagnostic,
  type RuntimeRegistry,
  type WorkflowContract,
  type WorkflowStep,
  parseMarkdownRecord
} from "@callumalpass/mdbase-runtime/node";
import {
  buildWorkflowActivation,
  evaluateCel,
  evaluateTemplate
} from "@mdbase/cel-host";

export interface RuntimeRecordStore {
  read(path: string): Promise<StoredRecord | undefined> | StoredRecord | undefined;
  patch(path: string, patch: Record<string, unknown>): Promise<PatchRecordOutput> | PatchRecordOutput;
}

export interface StoredRecord {
  path: string;
  frontmatter: Record<string, unknown>;
  body: string;
}

export interface PatchRecordOutput {
  path: string;
  frontmatter: Record<string, unknown>;
}

export interface ActionContext {
  workflow: WorkflowContract;
  step: WorkflowStep;
  event: Record<string, unknown>;
}

export type ActionHandler = (input: unknown, context: ActionContext) => Promise<unknown> | unknown;

export interface ExecuteRuntimeEventOptions {
  collectionRoot: string;
  event: Record<string, unknown>;
  executor?: string;
  handlers?: Record<string, ActionHandler>;
  recordStore?: RuntimeRecordStore;
}

export interface RuntimeExecutionResult {
  valid: boolean;
  diagnostics: RuntimeDiagnostic[];
  runs: WorkflowRunResult[];
}

export interface WorkflowRunResult {
  workflow: string;
  trigger: string;
  status: "succeeded" | "failed" | "skipped";
  steps: StepExecutionResult[];
}

export interface StepExecutionResult {
  id: string;
  action: string;
  status: "succeeded" | "failed" | "skipped";
  input?: unknown;
  output?: unknown;
  diagnostics: RuntimeDiagnostic[];
}

export class InMemoryRecordStore implements RuntimeRecordStore {
  private readonly records = new Map<string, StoredRecord>();

  static async fromCollection(collectionRoot: string, paths: string[]): Promise<InMemoryRecordStore> {
    const store = new InMemoryRecordStore();
    for (const path of paths) {
      const parsed = parseMarkdownRecord(path, await readFile(resolve(collectionRoot, path), "utf8"));
      if (!parsed.record || parsed.diagnostics.some((diagnostic) => diagnostic.severity === "error")) {
        throw new Error(`Unable to load record ${path}.`);
      }
      store.set(parsed.record);
    }
    return store;
  }

  set(record: StoredRecord): void {
    this.records.set(record.path, cloneRecord(record));
  }

  read(path: string): StoredRecord | undefined {
    const record = this.records.get(path);
    return record ? cloneRecord(record) : undefined;
  }

  patch(path: string, patch: Record<string, unknown>): PatchRecordOutput {
    const record = this.records.get(path);
    if (!record) {
      throw new Error(`Record ${path} was not found.`);
    }
    record.frontmatter = {
      ...record.frontmatter,
      ...patch
    };
    return {
      path,
      frontmatter: { ...record.frontmatter }
    };
  }
}

export function createMdbaseActionHandlers(recordStore: RuntimeRecordStore): Record<string, ActionHandler> {
  return {
    "mdbase.record.patch": async (input) => {
      if (!isPlainObject(input) || typeof input.path !== "string" || !isPlainObject(input.patch)) {
        throw new Error("mdbase.record.patch input must include path and patch.");
      }
      return recordStore.patch(input.path, input.patch);
    }
  };
}

export async function executeRuntimeEvent(options: ExecuteRuntimeEventOptions): Promise<RuntimeExecutionResult> {
  const validator = await RuntimeContractValidator.create();
  const loaded = await validator.loadRuntimeContracts(options.collectionRoot);
  const diagnostics: RuntimeDiagnostic[] = [...loaded.diagnostics];
  const runs: WorkflowRunResult[] = [];

  if (!loaded.valid) {
    return result(diagnostics, runs);
  }

  const eventValidation = validator.validateEventEnvelope(loaded.registry, options.event);
  diagnostics.push(...eventValidation.diagnostics);
  if (!eventValidation.valid) {
    return result(diagnostics, runs);
  }

  const handlers = {
    ...(options.recordStore ? createMdbaseActionHandlers(options.recordStore) : {}),
    ...(options.handlers ?? {})
  };

  for (const workflow of [...loaded.registry.workflows.values()].sort((a, b) => a.id.localeCompare(b.id))) {
    if (workflow.enabled === false || !executorShouldRunWorkflow(loaded.registry, workflow, options.executor)) {
      continue;
    }
    for (const trigger of workflow.triggers ?? []) {
      if (trigger.event !== options.event.type) {
        continue;
      }

      const steps: Record<string, StepExecutionResult> = {};
      const activation = () => buildWorkflowActivation({
        event: options.event,
        steps,
        vars: workflow.vars as Record<string, unknown> | undefined
      }) as unknown as Record<string, unknown>;

      const triggerCondition = evaluateCondition(trigger.if, activation(), workflow.id);
      diagnostics.push(...triggerCondition.diagnostics);
      if (!triggerCondition.matched) {
        continue;
      }

      const run: WorkflowRunResult = {
        workflow: workflow.id,
        trigger: trigger.id,
        status: "succeeded",
        steps: []
      };

      for (const step of workflow.steps ?? []) {
        const stepResult = await executeStep({
          validator,
          registry: loaded.registry,
          workflow,
          step,
          event: options.event,
          activation: activation(),
          handlers
        });
        steps[step.id] = stepResult;
        run.steps.push(stepResult);
        diagnostics.push(...stepResult.diagnostics);

        if (stepResult.status === "failed") {
          run.status = "failed";
          if (workflow.run?.on_error !== "continue") {
            break;
          }
        }
      }

      runs.push(run);
    }
  }

  return result(diagnostics, runs);
}

async function executeStep(options: {
  validator: RuntimeContractValidator;
  registry: RuntimeRegistry;
  workflow: WorkflowContract;
  step: WorkflowStep;
  event: Record<string, unknown>;
  activation: Record<string, unknown>;
  handlers: Record<string, ActionHandler>;
}): Promise<StepExecutionResult> {
  const diagnostics: RuntimeDiagnostic[] = [];
  const condition = evaluateCondition(options.step.if, options.activation, options.workflow.id);
  diagnostics.push(...condition.diagnostics);
  if (!condition.matched) {
    return {
      id: options.step.id,
      action: options.step.action,
      status: "skipped",
      diagnostics
    };
  }

  if (options.step.for_each) {
    return failedStep(options.step, diagnostics, diagnostic("unsupported_for_each", "The prototype executor does not implement for_each.", options.step.id));
  }

  const inputEvaluation = evaluateExpressionValue(options.step.input ?? {}, options.activation, options.step.id);
  diagnostics.push(...inputEvaluation.diagnostics);
  const inputValidation = options.validator.validateActionInput(options.registry, options.step.action, inputEvaluation.value);
  diagnostics.push(...inputValidation.diagnostics);
  if (!inputValidation.valid) {
    return failedStep(options.step, diagnostics);
  }

  const handler = options.handlers[options.step.action];
  if (!handler) {
    return failedStep(options.step, diagnostics, diagnostic("unsupported_action_handler", `No handler is registered for ${options.step.action}.`, options.step.action));
  }

  try {
    const output = await handler(inputEvaluation.value, {
      workflow: options.workflow,
      step: options.step,
      event: options.event
    });
    const outputValidation = options.validator.validateActionOutput(options.registry, options.step.action, output);
    diagnostics.push(...outputValidation.diagnostics);
    if (!outputValidation.valid) {
      return failedStep(options.step, diagnostics);
    }
    return {
      id: options.step.id,
      action: options.step.action,
      status: "succeeded",
      input: inputEvaluation.value,
      output,
      diagnostics
    };
  } catch (error) {
    return failedStep(options.step, diagnostics, diagnostic("action_handler_error", error instanceof Error ? error.message : "Action handler failed.", options.step.action));
  }
}

function evaluateCondition(condition: { $expr: string } | undefined, activation: Record<string, unknown>, source: string): { matched: boolean; diagnostics: RuntimeDiagnostic[] } {
  if (!condition) {
    return { matched: true, diagnostics: [] };
  }
  const evaluated = evaluateCel(condition.$expr, activation as Parameters<typeof evaluateCel>[1]);
  return {
    matched: evaluated.value === true,
    diagnostics: evaluated.diagnostics.map((item) => diagnostic(item.code, item.message, source))
  };
}

function evaluateExpressionValue(value: unknown, activation: Record<string, unknown>, source: string): { value: unknown; diagnostics: RuntimeDiagnostic[] } {
  const diagnostics: RuntimeDiagnostic[] = [];
  const evaluated = evaluateTemplate(value, activation, (expr, nestedActivation) => {
    const result = evaluateCel(expr, nestedActivation as Parameters<typeof evaluateCel>[1]);
    diagnostics.push(...result.diagnostics.map((item) => diagnostic(item.code, item.message, source)));
    return result.value;
  });
  return { value: evaluated, diagnostics };
}

function executorShouldRunWorkflow(registry: RuntimeRegistry, workflow: WorkflowContract, executor: string | undefined): boolean {
  if (workflow.run?.execution?.mode !== "single_executor") {
    return true;
  }
  return selectedExecutorForWorkflow(registry, workflow.id) === executor;
}

function selectedExecutorForWorkflow(registry: RuntimeRegistry, workflowId: string): string | undefined {
  const policies = [...registry.policies.values()]
    .filter((policy) => policy.enabled !== false)
    .sort((a, b) => a.id.localeCompare(b.id));
  for (const policy of policies) {
    const workflowExecutor = policy.executors?.workflows?.[workflowId];
    if (workflowExecutor) {
      return workflowExecutor;
    }
  }
  for (const policy of policies) {
    if (policy.executors?.default) {
      return policy.executors.default;
    }
  }
  return undefined;
}

function failedStep(step: WorkflowStep, diagnostics: RuntimeDiagnostic[], extra?: RuntimeDiagnostic): StepExecutionResult {
  if (extra) {
    diagnostics.push(extra);
  }
  return {
    id: step.id,
    action: step.action,
    status: "failed",
    diagnostics
  };
}

function result(diagnostics: RuntimeDiagnostic[], runs: WorkflowRunResult[]): RuntimeExecutionResult {
  return {
    valid: !diagnostics.some((item) => item.severity === "error"),
    diagnostics,
    runs
  };
}

function diagnostic(code: string, message: string, id?: string): RuntimeDiagnostic {
  return {
    severity: "error",
    code,
    message,
    id
  };
}

function cloneRecord(record: StoredRecord): StoredRecord {
  return {
    path: record.path,
    frontmatter: { ...record.frontmatter },
    body: record.body
  };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
