import { describe, it, expect } from "vitest";
import { calculatePostponedDate } from "./task-list";

describe("calculatePostponedDate", () => {
  it("should calculate tomorrow date preserving time of day when timeRange.start is provided", () => {
    const originalIso = "2026-10-14T09:30:00.000Z";
    const result = calculatePostponedDate({
      timeRange: { start: originalIso, end: originalIso },
    });

    const originalDate = new Date(originalIso);
    const resultDate = new Date(result);

    expect(resultDate.getHours()).toBe(originalDate.getHours());
    expect(resultDate.getMinutes()).toBe(originalDate.getMinutes());
    expect(resultDate.getSeconds()).toBe(originalDate.getSeconds());

    // Should be strictly after the original date
    expect(resultDate.getTime()).toBeGreaterThan(Date.now());
  });

  it("should handle null timeRange without throwing", () => {
    const result = calculatePostponedDate({ timeRange: null });
    expect(result).toBeDefined();
    expect(new Date(result).getTime()).toBeGreaterThan(Date.now());
  });
});
