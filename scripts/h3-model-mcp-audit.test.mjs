import { describe, expect, test } from "bun:test";
import { chooseReferences, extractDurationMs, extractTaskId, mapLimit, taskOperationIds, withinHardDurationLimit } from "./h3-model-mcp-audit.mjs";

describe("H3 MCP audit runner helpers", () => {
  test("selects matching-ratio images first and deduplicates resources", () => {
    const refs = {
      images: [
        { nodeId: "portrait", resourceId: "same", ratio: "9:16" },
        { nodeId: "landscape-a", resourceId: "landscape-a", ratio: "16:9" },
        { nodeId: "landscape-duplicate", resourceId: "landscape-a", ratio: "16:9" },
        { nodeId: "landscape-b", resourceId: "landscape-b", ratio: "16:9" },
      ],
      audios: [{ nodeId: "audio-a", resourceId: "audio-a" }, { nodeId: "audio-duplicate", resourceId: "landscape-a" }],
    };
    const chosen = chooseReferences(refs, "16:9", 2, 1);
    expect(chosen.images.map((item) => item.nodeId)).toEqual(["landscape-a", "landscape-b"]);
    expect(chosen.audios.map((item) => item.nodeId)).toEqual(["audio-a"]);
  });

  test("uses stable but distinct create and run operation ids", () => {
    const first = taskOperationIds("h3-audit-001");
    expect(first).toEqual(taskOperationIds("h3-audit-001"));
    expect(first.create).not.toBe(first.run);
    expect(first.create.length).toBeGreaterThanOrEqual(16);
  });

  test("extracts durable task ids and actual durations in ms", () => {
    expect(extractTaskId({ receipt: { taskId: "task-123" } })).toBe("task-123");
    expect(extractDurationMs({ probe: { video: { duration: 2.333 } } })).toBe(2333);
    expect(extractDurationMs({ video: { durationMs: 2999 } })).toBe(2999);
    expect(extractDurationMs({ video: { duration: 3.001 } })).toBe(3001);
    expect(withinHardDurationLimit(2333)).toBe(true);
    expect(withinHardDurationLimit(3000)).toBe(true);
    expect(withinHardDurationLimit(3001)).toBe(false);
  });

  test("never duplicates a reference resource to satisfy a larger image request", () => {
    const chosen = chooseReferences({ images: [{ nodeId: "only", resourceId: "one", ratio: "16:9" }], audios: [] }, "16:9", 4, 0);
    expect(chosen.images).toHaveLength(1);
    expect(new Set(chosen.images.map((item) => item.resourceId)).size).toBe(chosen.images.length);
  });

  test("limits concurrent tasks", async () => {
    let active = 0;
    let maximum = 0;
    await mapLimit([1, 2, 3, 4, 5, 6], 2, async (value) => {
      active++;
      maximum = Math.max(maximum, active);
      await new Promise((resolve) => setTimeout(resolve, 3));
      active--;
      return value;
    });
    expect(maximum).toBe(2);
  });
});
