import { parse } from "yaml";
import type { MarkdownRecord, RuntimeDiagnostic } from "./types.js";

const frontmatterPattern = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/;

export function parseMarkdownRecord(path: string, text: string): {
  record?: MarkdownRecord;
  diagnostics: RuntimeDiagnostic[];
} {
  const match = text.match(frontmatterPattern);
  if (!match) {
    return {
      record: {
        path,
        frontmatter: {},
        body: text
      },
      diagnostics: []
    };
  }

  try {
    const parsed = parse(match[1] ?? "");
    if (parsed == null) {
      return {
        record: {
          path,
          frontmatter: {},
          body: match[2] ?? ""
        },
        diagnostics: []
      };
    }

    if (!isPlainObject(parsed)) {
      return {
        diagnostics: [
          {
            severity: "error",
            code: "invalid_frontmatter",
            message: "Frontmatter must parse to an object.",
            path
          }
        ]
      };
    }

    return {
      record: {
        path,
        frontmatter: parsed as Record<string, unknown>,
        body: match[2] ?? ""
      },
      diagnostics: []
    };
  } catch (error) {
    return {
      diagnostics: [
        {
          severity: "error",
          code: "invalid_frontmatter",
          message: error instanceof Error ? error.message : "Unable to parse frontmatter.",
          path
        }
      ]
    };
  }
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

