import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";
import { formatDate } from "./formatDate";

describe("formatDate", () => {
  beforeEach(() => {
    // Lock timezone to UTC so tests behave identically locally and in CI
    vi.stubEnv("TZ", "UTC");
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it("handles exactly 24 hours ago boundary correctly", () => {
    vi.useFakeTimers();
    const now = new Date(Date.UTC(2026, 7, 24, 21, 0));
    vi.setSystemTime(now);

    const exactly24HoursAgo = new Date(Date.UTC(2026, 7, 23, 21, 0));

    // Verify whether 24h sharp should show HH:MM or DD-MMM
    expect(formatDate(exactly24HoursAgo.toISOString())).toBe("23-08");
  });

  it("returns an empty string when given null or empty input", () => {
    expect(formatDate(null)).toBe("");
    expect(formatDate("")).toBe("");
  });

  it("returns HH:MM for a date less than 24 hours ago", () => {
    vi.useFakeTimers();
    const now = new Date(Date.UTC(2026, 7, 24, 21, 0));
    vi.setSystemTime(now);

    const oneHourAgo = new Date(Date.UTC(2026, 7, 24, 20, 0));
    expect(formatDate(oneHourAgo.toISOString())).toBe("20:00");
  });

  it("returns DD-MMM for a date older than 24 hours but less than a year", () => {
    vi.useFakeTimers();
    const now = new Date(Date.UTC(2026, 7, 24, 21, 0));
    vi.setSystemTime(now);

    const date = new Date(Date.UTC(2026, 7, 20, 10, 30));
    expect(formatDate(date.toISOString())).toBe("20-08");
  });

  it("returns DD-MMM-YY for a date older than one year", () => {
    vi.useFakeTimers();
    const now = new Date(Date.UTC(2026, 7, 24, 21, 0));
    vi.setSystemTime(now);

    const date = new Date(Date.UTC(2025, 6, 15, 10, 30));
    expect(formatDate(date.toISOString())).toBe("15-07-25");
  });
});
