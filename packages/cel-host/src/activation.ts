import { basename, dirname, extname } from "node:path/posix";
import { isPlainObject, type MarkdownRecord } from "./markdown.js";

export interface BuildRecordActivationOptions {
  readDefaults?: Record<string, unknown>;
  knownFields?: Iterable<string>;
  includeBody?: boolean;
}

export interface BuildWorkflowActivationOptions {
  event?: Record<string, unknown>;
  steps?: Record<string, unknown>;
  vars?: Record<string, unknown>;
  item?: unknown;
}

export interface MdbaseFileActivation {
  path: string;
  name: string;
  basename: string;
  ext: string;
  folder: string;
  body?: string;
  tags: string[];
  links: string[];
  embeds: string[];
}

export interface RecordActivation {
  [key: string]: unknown;
  raw: Record<string, unknown>;
  record: Record<string, unknown>;
  note: Record<string, unknown>;
  present: {
    raw: Record<string, boolean>;
    record: Record<string, boolean>;
    note: Record<string, boolean>;
  };
  file: MdbaseFileActivation;
}

export interface WorkflowActivation {
  event?: Record<string, unknown>;
  steps: Record<string, unknown>;
  vars: Record<string, unknown>;
  item?: unknown;
}

export function buildRecordActivation(
  record: MarkdownRecord,
  options: BuildRecordActivationOptions = {}
): RecordActivation {
  const raw = cloneObject(record.frontmatter);
  const effective = applyReadDefaults(raw, options.readDefaults ?? {});
  const fieldNames = collectFieldNames(raw, effective, options.readDefaults ?? {}, options.knownFields);
  const recordPresence = presenceMap(effective, fieldNames);
  const file = buildFileActivation(record, options);

  return {
    ...effective,
    raw,
    record: effective,
    note: effective,
    present: {
      raw: presenceMap(raw, fieldNames),
      record: recordPresence,
      note: recordPresence
    },
    file
  };
}

export function buildWorkflowActivation(options: BuildWorkflowActivationOptions): WorkflowActivation {
  return {
    event: options.event,
    steps: options.steps ?? {},
    vars: options.vars ?? {},
    ...(Object.prototype.hasOwnProperty.call(options, "item") ? { item: options.item } : {})
  };
}

export function evaluateTemplate(value: unknown, activation: Record<string, unknown>, evaluate: (expr: string, activation: Record<string, unknown>) => unknown): unknown {
  if (isExpressionObject(value)) {
    return evaluate(value.$expr, activation);
  }
  if (Array.isArray(value)) {
    return value.map((item) => evaluateTemplate(item, activation, evaluate));
  }
  if (isPlainObject(value)) {
    const result: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value)) {
      result[key] = evaluateTemplate(child, activation, evaluate);
    }
    return result;
  }
  return value;
}

export function applyReadDefaults(raw: Record<string, unknown>, readDefaults: Record<string, unknown>): Record<string, unknown> {
  const effective = cloneObject(raw);
  for (const [key, value] of Object.entries(readDefaults)) {
    if (!Object.prototype.hasOwnProperty.call(effective, key)) {
      effective[key] = value;
    }
  }
  return effective;
}

export function buildFileActivation(
  record: MarkdownRecord,
  options: BuildRecordActivationOptions = {}
): MdbaseFileActivation {
  const name = basename(record.path);
  const ext = extname(name).replace(/^\./, "");
  const base = ext ? name.slice(0, -(ext.length + 1)) : name;
  const folder = dirname(record.path) === "." ? "" : dirname(record.path);
  const body = options.includeBody === false ? undefined : record.body;
  return {
    path: record.path,
    name,
    basename: base,
    ext,
    folder,
    ...(body === undefined ? {} : { body }),
    tags: extractTags(record.frontmatter, record.body),
    links: [],
    embeds: []
  };
}

export function extractTags(frontmatter: Record<string, unknown>, body: string): string[] {
  const tags = new Set<string>();
  const frontmatterTags = frontmatter.tags;
  if (typeof frontmatterTags === "string") {
    tags.add(normalizeTag(frontmatterTags));
  } else if (Array.isArray(frontmatterTags)) {
    for (const tag of frontmatterTags) {
      if (typeof tag === "string") {
        tags.add(normalizeTag(tag));
      }
    }
  }

  for (const tag of extractBodyTags(body)) {
    tags.add(tag);
  }

  return [...tags].filter(Boolean).sort();
}

export function extractBodyTags(body: string): string[] {
  const tags = new Set<string>();
  const withoutCodeBlocks = body.replace(/```[\s\S]*?```/g, "");
  const pattern = /(^|\s)#([A-Za-z0-9_/-]+)/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(withoutCodeBlocks))) {
    tags.add(match[2]);
  }
  return [...tags];
}

export function hasTag(tags: readonly string[], query: string): boolean {
  const normalized = normalizeTag(query);
  return tags.some((tag) => tag === normalized || tag.startsWith(`${normalized}/`));
}

export function inFolder(fileFolder: string, query: string): boolean {
  const normalizedFolder = trimSlashes(fileFolder);
  const normalizedQuery = trimSlashes(query);
  return normalizedFolder === normalizedQuery || normalizedFolder.startsWith(`${normalizedQuery}/`);
}

function cloneObject(value: Record<string, unknown>): Record<string, unknown> {
  return { ...value };
}

function collectFieldNames(
  raw: Record<string, unknown>,
  effective: Record<string, unknown>,
  readDefaults: Record<string, unknown>,
  knownFields: Iterable<string> | undefined
): string[] {
  const fields = new Set<string>([
    ...Object.keys(raw),
    ...Object.keys(effective),
    ...Object.keys(readDefaults)
  ]);
  if (knownFields) {
    for (const field of knownFields) {
      fields.add(field);
    }
  }
  return [...fields].sort();
}

function presenceMap(source: Record<string, unknown>, fieldNames: readonly string[]): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  for (const field of fieldNames) {
    result[field] = Object.prototype.hasOwnProperty.call(source, field);
  }
  return result;
}

function normalizeTag(tag: string): string {
  return tag.replace(/^#/, "");
}

function trimSlashes(value: string): string {
  return value.replace(/^\/+|\/+$/g, "");
}

function isExpressionObject(value: unknown): value is { $expr: string } {
  return isPlainObject(value) && typeof value.$expr === "string" && Object.keys(value).length === 1;
}
