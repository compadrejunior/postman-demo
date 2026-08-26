import { describe, expect, it } from "vitest";
import { isTaskPriority } from "../../../../src/domain/value-objects/TaskPriority.js";

describe("isTaskPriority", () => {
  it("accepts known priorities", () => {
    expect(isTaskPriority("low")).toBe(true);
    expect(isTaskPriority("medium")).toBe(true);
    expect(isTaskPriority("high")).toBe(true);
  });

  it("rejects unknown values", () => {
    expect(isTaskPriority("bogus")).toBe(false);
  });
});
