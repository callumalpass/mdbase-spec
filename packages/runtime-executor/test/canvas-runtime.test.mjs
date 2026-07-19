import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  InMemoryRecordStore,
  executeRuntimeEvent
} from "../dist/index.js";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const exampleRoot = resolve(repoRoot, "examples/v0.3/canvas-runtime");

test("executes canvas drop workflow and patches task status in memory", async () => {
  const store = await InMemoryRecordStore.fromCollection(exampleRoot, ["tasks/card-001.md"]);
  const event = JSON.parse(
    await readFile(resolve(exampleRoot, "runtime-events/sample-canvas-drop-event.json"), "utf8")
  );

  const before = store.read("tasks/card-001.md");
  assert.equal(before?.frontmatter.status, "todo");

  const result = await executeRuntimeEvent({
    collectionRoot: exampleRoot,
    event,
    executor: "obsidian",
    recordStore: store
  });

  assert.equal(result.valid, true);
  assert.deepEqual(result.diagnostics, []);
  assert.equal(result.runs.length, 1);
  assert.equal(result.runs[0].workflow, "canvas.zone.set-status");
  assert.equal(result.runs[0].trigger, "drop-on-status-zone");
  assert.equal(result.runs[0].status, "succeeded");
  assert.equal(result.runs[0].steps.length, 1);
  assert.equal(result.runs[0].steps[0].action, "mdbase.record.patch");
  assert.equal(result.runs[0].steps[0].status, "succeeded");
  assert.deepEqual(result.runs[0].steps[0].input, {
    path: "tasks/card-001.md",
    patch: {
      status: "doing"
    }
  });

  const after = store.read("tasks/card-001.md");
  assert.equal(after?.frontmatter.status, "doing");
});

test("does not run single-executor workflows for a non-selected executor", async () => {
  const store = await InMemoryRecordStore.fromCollection(exampleRoot, ["tasks/card-001.md"]);
  const event = JSON.parse(
    await readFile(resolve(exampleRoot, "runtime-events/sample-canvas-drop-event.json"), "utf8")
  );

  const result = await executeRuntimeEvent({
    collectionRoot: exampleRoot,
    event,
    executor: "mdbase-daemon",
    recordStore: store
  });

  assert.equal(result.valid, true);
  assert.deepEqual(result.diagnostics, []);
  assert.equal(result.runs.length, 0);
  assert.equal(store.read("tasks/card-001.md")?.frontmatter.status, "todo");
});
