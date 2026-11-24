import type { ScheduleResponse } from "./api";

export function isScheduledOn(schedule: ScheduleResponse, date: string) {
  return (
    schedule.startsOn <= date && date <= (schedule.endsOn ?? schedule.startsOn)
  );
}

export function scheduleKey(schedule: ScheduleResponse) {
  return schedule.scheduleId ?? `${schedule.kind}:${schedule.startsOn}`;
}
