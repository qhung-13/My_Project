import { describe, it, expect } from "vitest";
import { formatDuration, formatViewers, generateColor } from "../format";

describe("formatViewers", () => {
  it("returns the raw number as a string below 1000", () => {
    expect(formatViewers(0)).toBe("0");
    expect(formatViewers(999)).toBe("999");
  });

  it("formats thousands with one decimal and a 'k' suffix", () => {
    expect(formatViewers(1000)).toBe("1.0k");
    expect(formatViewers(1234)).toBe("1.2k");
    expect(formatViewers(15600)).toBe("15.6k");
  });
});

describe("generateColor", () => {
  it("is deterministic for the same input", () => {
    expect(generateColor("Alice")).toBe(generateColor("Alice"));
  });

  it("always returns one of the defined palette colors", () => {
    const palette = [
      "#6366f1",
      "#8b5cf6",
      "#ec4899",
      "#ef4444",
      "#f97316",
      "#eab308",
      "#22c55e",
      "#14b8a6",
      "#3b82f6",
      "#06b6d4",
    ];
    for (const name of ["Alice", "Bob", "", "streamer_123", "🔥emoji"]) {
      expect(palette).toContain(generateColor(name));
    }
  });
});

describe("formatDuration", () => {
  it("formats minute and hour durations", () => {
    expect(formatDuration(65)).toBe("1:05");
    expect(formatDuration(3661)).toBe("1:01:01");
  });

  it("handles invalid and negative values", () => {
    expect(formatDuration(Number.NaN)).toBe("0:00");
    expect(formatDuration(-10)).toBe("0:00");
  });
});
