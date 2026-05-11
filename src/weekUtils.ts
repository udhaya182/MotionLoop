import type { DayPlan, Exercise } from "./types";

const pad = (n: number) => String(n).padStart(2, "0");

/** Local date to yyyy-MM-dd */
export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Parse yyyy-MM-dd as local midnight */
export function parseISO(iso: string): Date {
  const [y, m, day] = iso.split("-").map(Number);
  return new Date(y, m - 1, day);
}

/** Sunday 00:00 local for the week containing `d` (visual week Sun→Sat). */
export function startOfWeekSunday(d: Date): Date {
  const c = new Date(d);
  c.setDate(c.getDate() - c.getDay());
  c.setHours(0, 0, 0, 0);
  return c;
}

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** `weekStart` must be a Sunday. Builds Sun→Sat. */
export function buildWeekDays(weekStart: Date): Omit<DayPlan, "workoutType" | "exercises" | "done">[] {
  const out: Omit<DayPlan, "workoutType" | "exercises" | "done">[] = [];
  for (let i = 0; i < 7; i++) {
    const x = new Date(weekStart);
    x.setDate(weekStart.getDate() + i);
    out.push({
      dateISO: toISODate(x),
      dow: DOW[x.getDay()],
    });
  }
  return out;
}

export function createEmptyWeek(weekStartSunday: Date): DayPlan[] {
  return buildWeekDays(weekStartSunday).map((b) => ({
    ...b,
    workoutType: "",
    exercises: [],
    done: false,
  }));
}

function cloneExercises(ex: Exercise[]): Exercise[] {
  return ex.map((e) => ({ ...e }));
}

function emptyWorkout(): { workoutType: string; exercises: Exercise[] } {
  return { workoutType: "", exercises: [] };
}

/**
 * Skip on calendar day `skippedIndex` (0=Sun … 6=Sat): that day's workout carries to the **next**
 * calendar day; later days each receive the previous day's former plan. Sat skip wraps to Sun.
 * Calendar slots (dates/dow) stay fixed — only workout payloads move forward in time.
 */
export function carrySkippedForward(days: DayPlan[], skippedIndex: number): DayPlan[] {
  if (days.length !== 7 || skippedIndex < 0 || skippedIndex > 6) return days;

  const orig = days.map((d) => ({
    workoutType: d.workoutType,
    exercises: cloneExercises(d.exercises),
  }));

  const nextPayload = orig.map((p) => ({
    workoutType: p.workoutType,
    exercises: cloneExercises(p.exercises),
  }));

  if (skippedIndex === 6) {
    nextPayload[0] = {
      workoutType: orig[6].workoutType,
      exercises: cloneExercises(orig[6].exercises),
    };
    for (let j = 1; j <= 6; j++) {
      nextPayload[j] = {
        workoutType: orig[j - 1].workoutType,
        exercises: cloneExercises(orig[j - 1].exercises),
      };
    }
  } else {
    nextPayload[skippedIndex] = emptyWorkout();
    for (let idx = skippedIndex + 1; idx <= 6; idx++) {
      nextPayload[idx] = {
        workoutType: orig[idx - 1].workoutType,
        exercises: cloneExercises(orig[idx - 1].exercises),
      };
    }
  }

  return days.map((day, idx) => ({
    ...day,
    workoutType: nextPayload[idx]?.workoutType ?? "",
    exercises: nextPayload[idx]?.exercises ?? [],
    done: false,
  }));
}

/** Merge prior plans into a new week skeleton by matching calendar dates. */
export function mergeDaysByDate(skeleton: DayPlan[], previous: DayPlan[]): DayPlan[] {
  const map = new Map(previous.map((d) => [d.dateISO, d]));
  return skeleton.map((s) => {
    const old = map.get(s.dateISO);
    return {
      ...s,
      workoutType: old?.workoutType ?? "",
      exercises: old?.exercises ? old.exercises.map((e) => ({ ...e })) : [],
      done: old?.done ?? false,
    };
  });
}

/** Copy loop order (indices 0→6) onto a new Sun→Sat skeleton; clears done flags. */
export function seedLoopOntoSkeleton(
  previousDays: DayPlan[],
  skeleton: DayPlan[]
): DayPlan[] {
  return skeleton.map((s, i) => ({
    ...s,
    workoutType: previousDays[i]?.workoutType ?? "",
    exercises: previousDays[i]?.exercises
      ? previousDays[i].exercises.map((e) => ({ ...e }))
      : [],
    done: false,
  }));
}

export function weekRangeLabel(sundayISO: string): string {
  const start = parseISO(sundayISO);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const o: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
  };
  return `${start.toLocaleDateString(undefined, o)} – ${end.toLocaleDateString(undefined, {
    ...o,
    year: "numeric",
  })}`;
}

export function countDoneDays(days: DayPlan[]): number {
  return days.filter((d) => d.done).length;
}
