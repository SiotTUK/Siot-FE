import { describe, expect, it } from "vitest";
import type { ScheduleResponse } from "./api";
import { isScheduledOn } from "./calendar";

const schedule: ScheduleResponse = {
  scheduleId: 1,
  guideId: null,
  kind: "TAX",
  title: "Tax schedule",
  startsOn: "2026-11-28",
  endsOn: "2026-12-02",
  targetDescription: null,
  sourceUrl: null,
  personal: false,
  highlighted: false,
};

describe("isScheduledOn", () => {
  it("includes both boundaries and dates inside a range crossing a month", () => {
    for (const date of ["2026-11-28", "2026-12-01", "2026-12-02"]) {
      expect(isScheduledOn(schedule, date)).toBe(true);
    }
    expect(isScheduledOn(schedule, "2026-11-27")).toBe(false);
    expect(isScheduledOn(schedule, "2026-12-03")).toBe(false);
  });

  it("uses the start date as the only day when there is no end date", () => {
    const oneDay = { ...schedule, endsOn: null };
    expect(isScheduledOn(oneDay, "2026-11-28")).toBe(true);
    expect(isScheduledOn(oneDay, "2026-11-29")).toBe(false);
  });
});
