export type RuntimeRecordType =
  | "provider"
  | "action"
  | "event"
  | "capability"
  | "workflow"
  | "runtime_policy"
  | "runtime_run"
  | "runtime_checkpoint"
  | "runtime_diagnostic";

export type RuntimeSeverity = "info" | "warning" | "error";

export interface RuntimeDiagnostic {
  severity: RuntimeSeverity;
  code: string;
  message: string;
  path?: string;
  id?: string;
  field?: string;
  details?: unknown;
}

export interface MarkdownRecord<T extends Record<string, unknown> = Record<string, unknown>> {
  path: string;
  frontmatter: T;
  body: string;
}

export interface RuntimeContractRecord extends Record<string, unknown> {
  type: RuntimeRecordType;
  id: string;
  version?: number;
  name?: string;
  provider?: string;
}

export interface ActionContract extends RuntimeContractRecord {
  type: "action";
  schemas: {
    dialect: "json-schema-2020-12";
    input: Record<string, unknown>;
    output?: Record<string, unknown> | null;
  };
  requires?: Requires;
  effects?: string[];
  emits?: string[];
}

export interface ProviderContract extends RuntimeContractRecord {
  type: "provider";
  provider_version: string;
  contracts?: {
    events?: string[];
    actions?: string[];
    capabilities?: string[];
    workflows?: string[];
  };
}

export interface EventContract extends RuntimeContractRecord {
  type: "event";
  schemas: {
    dialect: "json-schema-2020-12";
    payload: Record<string, unknown>;
  };
}

export interface CapabilityContract extends RuntimeContractRecord {
  type: "capability";
}

export interface WorkflowContract extends RuntimeContractRecord {
  type: "workflow";
  enabled?: boolean;
  requires?: Requires;
  vars?: Record<string, ExpressionValue>;
  triggers: WorkflowTrigger[];
  steps: WorkflowStep[];
  run?: WorkflowRunPolicy;
}

export interface RuntimePolicyContract extends RuntimeContractRecord {
  type: "runtime_policy";
  enabled?: boolean;
  executors?: {
    default?: string;
    workflows?: Record<string, string>;
  };
  capabilities?: Record<string, CapabilityPolicy>;
}

export interface RuntimeRunRecord extends RuntimeContractRecord {
  type: "runtime_run";
  workflow: string;
  status: "queued" | "running" | "succeeded" | "failed" | "cancelled";
  started_at: string;
}

export interface RuntimeCheckpointRecord extends RuntimeContractRecord {
  type: "runtime_checkpoint";
  workflow: string;
  status: "open" | "waiting" | "ready" | "completed" | "failed" | "cancelled";
  updated_at: string;
  state: Record<string, unknown>;
}

export interface RuntimeDiagnosticRecord extends RuntimeContractRecord {
  type: "runtime_diagnostic";
  severity: RuntimeSeverity;
  code: string;
  message: string;
  created_at: string;
}

export interface Requires {
  capabilities?: string[];
  providers?: ProviderRequirement[];
}

export type ProviderRequirement = string | {
  id: string;
  version: string;
};

export interface CapabilityPolicy {
  mode?: "allow" | "deny";
  max_files_per_run?: number;
  max_calls_per_run?: number;
}

export interface WorkflowTrigger {
  id: string;
  event: string;
  if?: ExpressionObject;
}

export interface WorkflowStep {
  id: string;
  action: string;
  input?: Record<string, unknown>;
  for_each?: {
    items: ExpressionValue;
    as?: string;
  };
  requires?: Requires;
  if?: ExpressionObject;
}

export interface WorkflowRunPolicy {
  execution?: {
    mode?: "single_executor" | "broadcast" | "best_effort";
  };
  idempotency?: {
    key: ExpressionValue;
  };
  concurrency?: {
    group?: ExpressionValue;
    policy: "skip" | "queue" | "replace" | "allow";
  };
  limits?: {
    timeout?: string;
    max_items?: number;
  };
  on_error?: "stop" | "continue";
}

export interface ExpressionObject {
  $expr: string;
}

export type ExpressionValue =
  | null
  | boolean
  | number
  | string
  | ExpressionObject
  | ExpressionValue[]
  | { [key: string]: ExpressionValue };

export interface RuntimePackage {
  root: string;
  typeFiles: MarkdownRecord[];
  records: MarkdownRecord<RuntimeContractRecord>[];
  actions: MarkdownRecord<ActionContract>[];
  events: MarkdownRecord<EventContract>[];
  providers: MarkdownRecord<ProviderContract>[];
  capabilities: MarkdownRecord<CapabilityContract>[];
  workflows: MarkdownRecord<WorkflowContract>[];
  policies: MarkdownRecord<RuntimePolicyContract>[];
  runs: MarkdownRecord<RuntimeRunRecord>[];
  checkpoints: MarkdownRecord<RuntimeCheckpointRecord>[];
  runtimeDiagnostics: MarkdownRecord<RuntimeDiagnosticRecord>[];
  diagnostics: RuntimeDiagnostic[];
}

export interface RuntimeRegistry {
  providerContracts: Map<string, ProviderContract>;
  actions: Map<string, ActionContract>;
  events: Map<string, EventContract>;
  capabilities: Map<string, CapabilityContract>;
  capabilityIds: Set<string>;
  workflows: Map<string, WorkflowContract>;
  policies: Map<string, RuntimePolicyContract>;
  providers: Set<string>;
  selectedPolicyId?: string;
  diagnostics: RuntimeDiagnostic[];
}

export interface LoadContractsOptions {
  schemaRoot?: string;
  includeTypeFiles?: boolean;
  implicitContracts?: RuntimeContractRecord[];
  selectedPolicyPath?: string;
  selectedPolicyId?: string;
}

export interface RuntimeEventEnvelope<
  TPayload extends Record<string, unknown> = Record<string, unknown>
> {
  type: string;
  contract_version: number;
  id: string;
  occurred_at: string;
  source: {
    runtime: string;
    provider?: string;
    collection?: string;
    [key: `x-${string}`]: unknown;
  };
  payload: TPayload;
  trace?: {
    correlation_id?: string;
    causation_id?: string;
    [key: `x-${string}`]: unknown;
  };
}

export interface AuthorizationContext {
  actor: {
    id: string;
    kind: string;
  };
  origin: {
    workflow?: string;
    path?: string;
    provider?: string;
  };
  run_id: string;
  correlation_id: string;
  causation_id?: string;
  executor: string;
  resource?: Record<string, unknown>;
}

export interface RuntimeProviderReadiness extends ValidationResult {
  status?: "ready" | "degraded" | "unavailable";
}

export type RuntimeEventHandler = (event: RuntimeEventEnvelope) => void | Promise<void>;

export interface RuntimeDisposable {
  dispose(): void | Promise<void>;
}

export interface RuntimeProvider {
  descriptor(): ProviderContract | Promise<ProviderContract>;
  contracts(): RuntimeContractRecord[] | Promise<RuntimeContractRecord[]>;
  readiness(): RuntimeProviderReadiness | Promise<RuntimeProviderReadiness>;
  subscribe(eventId: string, handler: RuntimeEventHandler): RuntimeDisposable;
  dispatch(actionId: string, input: unknown, context: AuthorizationContext): unknown | Promise<unknown>;
  dispose(): void | Promise<void>;
}

/** @deprecated Use RuntimeProvider. */
export type ProviderHost = RuntimeProvider;

export type ProviderRequirementInput = string | {
  id: string;
  version?: string;
};

export interface RuntimeRequirements {
  providers?: ProviderRequirementInput[];
  capabilities?: string[];
  actions?: string[];
}

export interface RuntimeProviderInfo {
  descriptor: ProviderContract;
  contracts: RuntimeContractRecord[];
}

export interface RuntimeProviderRegistration {
  providerId: string;
  unregister(): Promise<void>;
}

export interface RuntimePolicyInfo {
  id: string;
  selected: true;
  capabilities: Readonly<Record<string, "allow" | "deny">>;
}

export interface RuntimeHost {
  readonly profileVersion: "0.1.0";
  registerProvider(provider: RuntimeProvider): Promise<RuntimeProviderRegistration>;
  providers(): RuntimeProviderInfo[];
  contracts(): RuntimeContractRecord[];
  policy(): RuntimePolicyInfo;
  preflight(requirements?: RuntimeRequirements): ValidationResult;
  subscribe(eventId: string, handler: RuntimeEventHandler): RuntimeDisposable;
  dispatch(actionId: string, input: unknown, context: AuthorizationContext): Promise<unknown>;
  dispose(): Promise<void>;
}

export type MdbaseRuntimeDiagnostic = RuntimeDiagnostic;
export type MdbaseRuntimeValidationResult = ValidationResult;
export type MdbaseProviderContract = ProviderContract;
export type MdbaseEventContract = EventContract;
export type MdbaseActionContract = ActionContract;
export type MdbaseCapabilityContract = CapabilityContract;
export type MdbaseRuntimeContract = RuntimeContractRecord;
export type MdbaseRuntimeEventEnvelope<
  TPayload extends Record<string, unknown> = Record<string, unknown>
> = RuntimeEventEnvelope<TPayload>;
export type MdbaseRuntimeDispatchContext = AuthorizationContext;
export type MdbaseRuntimeProviderReadiness = RuntimeProviderReadiness;
export type MdbaseRuntimeEventHandler = RuntimeEventHandler;
export type MdbaseRuntimeDisposable = RuntimeDisposable;
export type MdbaseRuntimeProvider = RuntimeProvider;
export type MdbaseProviderRequirement = ProviderRequirementInput;
export type MdbaseRuntimeRequirements = RuntimeRequirements;
export type MdbaseRuntimeProviderInfo = RuntimeProviderInfo;
export type MdbaseRuntimeProviderRegistration = RuntimeProviderRegistration;
export type MdbaseRuntimePolicyInfo = RuntimePolicyInfo;
export type MdbaseRuntimeHostApi = RuntimeHost;

export interface ValidationResult {
  valid: boolean;
  diagnostics: RuntimeDiagnostic[];
}

export interface RuntimeLoadResult {
  contracts: RuntimePackage;
  registry: RuntimeRegistry;
  preflight: ValidationResult;
  valid: boolean;
  diagnostics: RuntimeDiagnostic[];
}
