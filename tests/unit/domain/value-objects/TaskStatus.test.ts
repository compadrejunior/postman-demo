import { describe, expect, it } from "vitest";
import { isTaskStatus } from "../../../../src/domain/value-objects/TaskStatus.js";

describe("isTaskStatus", () => {
  it("accepts known statuses", () => {
    expect(isTaskStatus("todo")).toBe(true);
    expect(isTaskStatus("in-progress")).toBe(true);
    expect(isTaskStatus("done")).toBe(true);
  });

  it("rejects unknown values", () => {
    expect(isTaskStatus("bogus")).toBe(false);
  });
});
