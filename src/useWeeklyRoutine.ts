import { useCallback, useEffect, useMemo, useState } from "react";
import type { AppPersistV2, Exercise, WeekRecord } from "./types";
import { loadAppStateV2, saveAppStateV2 } from "./storage";
import {
  carrySkippedForward,
  countDoneDays,
  createEmptyWeek,
  parseISO,
  seedLoopOntoSkeleton,
  startOfWeekSunday,
  toISODate,
  weekRangeLabel,
} from "./weekUtils";

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export type HistoryEntry = {
  sundayISO: string;
  label: string;
  doneCount: number;
  routineSet: boolean;
  updatedAt: string;
};

type State = {
  weeks: Record<string, WeekRecord>;
  todayISO: string;
  /** Sunday yyyy-MM-dd for the live calendar week */
  calendarSundayISO: string;
};

function ensureWeekEntry(
  weeks: Record<string, WeekRecord>,
  sundayISO: string
): Record<string, WeekRecord> {
  if (weeks[sundayISO]?.days?.length === 7) return weeks;

  const next = { ...weeks };
  const sortedPast = Object.keys(next)
    .filter((k) => k < sundayISO)
    .sort();

  const prevKey = sortedPast[sortedPast.length - 1];
  const skeleton = createEmptyWeek(parseISO(sundayISO));

  if (prevKey && next[prevKey]?.days?.length === 7) {
    next[sundayISO] = {
      days: seedLoopOntoSkeleton(next[prevKey].days, skeleton),
      routineSet: next[prevKey].routineSet,
      updatedAt: new Date().toISOString(),
    };
  } else {
    next[sundayISO] = {
      days: skeleton,
      routineSet: false,
      updatedAt: new Date().toISOString(),
    };
  }
  return next;
}

function readInitialState(): State {
  const today = new Date();
  const todayISO = toISODate(today);
  const calendarSundayISO = toISODate(startOfWeekSunday(today));

  const loaded = loadAppStateV2();
  let weeks = { ...(loaded.weeks ?? {}) };
  weeks = ensureWeekEntry(weeks, calendarSundayISO);

  return {
    weeks,
    todayISO,
    calendarSundayISO,
  };
}

export function useWeeklyRoutine() {
  const [state, setState] = useState<State>(readInitialState);

  useEffect(() => {
    const payload: AppPersistV2 = { version: 2, weeks: state.weeks };
    saveAppStateV2(payload);
  }, [state.weeks]);

  /** Roll into a new calendar week or refresh today’s date */
  useEffect(() => {
    const sync = () => {
      const today = new Date();
      const sunISO = toISODate(startOfWeekSunday(today));
      setState((prev) => {
        const todayISO = toISODate(today);
        if (sunISO === prev.calendarSundayISO) {
          return { ...prev, todayISO };
        }
        let weeks = { ...prev.weeks };
        weeks = ensureWeekEntry(weeks, sunISO);
        return {
          ...prev,
          todayISO,
          calendarSundayISO: sunISO,
          weeks,
        };
      });
    };
    window.addEventListener("focus", sync);
    const id = window.setInterval(sync, 60_000);
    return () => {
      window.removeEventListener("focus", sync);
      window.clearInterval(id);
    };
  }, []);

  const patchCurrentWeek = useCallback(
    (fn: (rec: WeekRecord) => WeekRecord) => {
      setState((prev) => {
        const sun = prev.calendarSundayISO;
        let weeks = { ...prev.weeks };
        weeks = ensureWeekEntry(weeks, sun);
        const cur = weeks[sun];
        if (!cur) return prev;
        const nextRec = fn(cur);
        weeks[sun] = {
          ...nextRec,
          updatedAt: new Date().toISOString(),
        };
        return { ...prev, weeks };
      });
    },
    []
  );

  const currentRecord = state.weeks[state.calendarSundayISO];

  const setWorkoutType = useCallback(
    (index: number, workoutType: string) => {
      patchCurrentWeek((rec) => {
        const next = [...rec.days];
        next[index] = { ...next[index], workoutType };
        return { ...rec, days: next };
      });
    },
    [patchCurrentWeek]
  );

  const addExercise = useCallback(
    (index: number, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      const ex: Exercise = { id: uid(), name: trimmed, bestWeight: null, unit: "lb" };
      patchCurrentWeek((rec) => {
        const next = [...rec.days];
        next[index] = {
          ...next[index],
          exercises: [...next[index].exercises, ex],
        };
        return { ...rec, days: next };
      });
    },
    [patchCurrentWeek]
  );

  const removeExercise = useCallback(
    (dayIndex: number, exerciseId: string) => {
      patchCurrentWeek((rec) => {
        const next = [...rec.days];
        next[dayIndex] = {
          ...next[dayIndex],
          exercises: next[dayIndex].exercises.filter((e) => e.id !== exerciseId),
        };
        return { ...rec, days: next };
      });
    },
    [patchCurrentWeek]
  );

  const updateExerciseBest = useCallback(
    (
      dayIndex: number,
      exerciseId: string,
      patch: { bestWeight?: number | null; unit?: "lb" | "kg" }
    ) => {
      patchCurrentWeek((rec) => {
        const next = [...rec.days];
        next[dayIndex] = {
          ...next[dayIndex],
          exercises: next[dayIndex].exercises.map((e) =>
            e.id === exerciseId
              ? {
                  ...e,
                  bestWeight:
                    patch.bestWeight === undefined ? e.bestWeight : patch.bestWeight,
                  unit: patch.unit === undefined ? e.unit : patch.unit,
                }
              : e
          ),
        };
        return { ...rec, days: next };
      });
    },
    [patchCurrentWeek]
  );

  const commitRoutine = useCallback(() => {
    patchCurrentWeek((rec) => ({ ...rec, routineSet: true }));
  }, [patchCurrentWeek]);

  const markDayDone = useCallback(
    (index: number) => {
      patchCurrentWeek((rec) => {
        const next = [...rec.days];
        next[index] = { ...next[index], done: true };
        return { ...rec, days: next };
      });
    },
    [patchCurrentWeek]
  );

  const markSkippedWorkout = useCallback((skippedDayIndex: number) => {
    patchCurrentWeek((rec) => ({
      ...rec,
      days: carrySkippedForward(rec.days, skippedDayIndex),
    }));
  }, [patchCurrentWeek]);

  const weekLabel = useMemo(
    () => weekRangeLabel(state.calendarSundayISO),
    [state.calendarSundayISO]
  );

  const historyEntries = useMemo((): HistoryEntry[] => {
    return Object.entries(state.weeks)
      .map(([sundayISO, rec]) => ({
        sundayISO,
        label: weekRangeLabel(sundayISO),
        doneCount: countDoneDays(rec.days),
        routineSet: rec.routineSet,
        updatedAt: rec.updatedAt,
      }))
      .sort((a, b) => (a.sundayISO < b.sundayISO ? 1 : -1));
  }, [state.weeks]);

  const getWeekRecord = useCallback(
    (sundayISO: string): WeekRecord | undefined => state.weeks[sundayISO],
    [state.weeks]
  );

  return {
    todayISO: state.todayISO,
    calendarSundayISO: state.calendarSundayISO,
    weekLabel,
    days: currentRecord?.days ?? [],
    routineSet: currentRecord?.routineSet ?? false,
    setWorkoutType,
    addExercise,
    removeExercise,
    updateExerciseBest,
    commitRoutine,
    markDayDone,
    markSkippedWorkout,
    historyEntries,
    getWeekRecord,
  };
}
