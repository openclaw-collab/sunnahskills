import { describe, it, expect } from "vitest";
import { NORMALIZED_SESSIONS } from "@/lib/scheduleCalendarData";

describe("Weekly Schedule Data", () => {
  it("has all 8 normalized sessions in data", () => {
    // There should be 8 sessions total:
    // - 2 girls (tue, fri)
    // - 2 boys (tue, fri)
    // - 2 women (tue, thu)
    // - 2 men (fri, sat)
    expect(NORMALIZED_SESSIONS).toHaveLength(8);

    // Check Tuesday specifically has 3 sessions
    const tuesdaySessions = NORMALIZED_SESSIONS.filter((s) => s.dayIndex === 2);
    expect(tuesdaySessions).toHaveLength(3);

    // Verify specific sessions exist
    const womenTue = NORMALIZED_SESSIONS.find((s) => s.id === "women-tue");
    const girlsTue = NORMALIZED_SESSIONS.find((s) => s.id === "girls-tue");
    const boysTue = NORMALIZED_SESSIONS.find((s) => s.id === "boys-tue");

    expect(womenTue).toBeDefined();
    expect(girlsTue).toBeDefined();
    expect(boysTue).toBeDefined();

    // Women session is 12:30-14:00
    expect(womenTue?.startMinutes).toBe(12 * 60 + 30); // 750
    expect(womenTue?.endMinutes).toBe(14 * 60); // 840

    // Girls and boys are both 14:30-15:30 (concurrent)
    expect(girlsTue?.startMinutes).toBe(14 * 60 + 30); // 870
    expect(girlsTue?.endMinutes).toBe(15 * 60 + 30); // 930
    expect(boysTue?.startMinutes).toBe(14 * 60 + 30); // 870
    expect(boysTue?.endMinutes).toBe(15 * 60 + 30); // 930
  });

  it("correctly identifies concurrent sessions on Tuesday", () => {
    const girlsTue = NORMALIZED_SESSIONS.find((s) => s.id === "girls-tue")!;
    const boysTue = NORMALIZED_SESSIONS.find((s) => s.id === "boys-tue")!;

    // They start at same time, so they definitely overlap
    const overlap =
      girlsTue.startMinutes < boysTue.endMinutes && boysTue.startMinutes < girlsTue.endMinutes;
    expect(overlap).toBe(true);
    expect(girlsTue.startMinutes).toBe(boysTue.startMinutes);
  });

  it("has correct track assignments", () => {
    const byTrack = {
      kids: NORMALIZED_SESSIONS.filter((s) => s.track === "kids"),
      women: NORMALIZED_SESSIONS.filter((s) => s.track === "women"),
      men: NORMALIZED_SESSIONS.filter((s) => s.track === "men"),
    };

    // Kids track should have 4 sessions (girls-tue, girls-fri, boys-tue, boys-fri)
    expect(byTrack.kids).toHaveLength(4);

    // Women track should have 2 sessions
    expect(byTrack.women).toHaveLength(2);

    // Men track should have 2 sessions
    expect(byTrack.men).toHaveLength(2);
  });

  it("has all registerable sessions", () => {
    const registerable = NORMALIZED_SESSIONS.filter((s) => s.registerable);
    expect(registerable).toHaveLength(8);
  });
});
