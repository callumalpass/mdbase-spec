import { stringify } from "yaml";
import type { RuntimeContractRecord } from "./types.js";

export function materializeContractRecord(record: RuntimeContractRecord, body?: string): string {
  const frontmatter = stringify(record).trimEnd();
  const heading = typeof record.name === "string" && record.name.length > 0 ? record.name : record.id;
  const recordBody = body ?? `# ${heading}\n\nMaterialized runtime contract for \`${record.id}\`.\n`;
  return `---\n${frontmatter}\n---\n\n${recordBody}`;
}

