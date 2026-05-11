export type Exercise = {
  id: string;
  name: string;
  /** Highest weight for this exercise (for the week) */
  bestWeight?: number | null;
  unit?: "lb" | "kg";
};

export type DayPlan = {
  /** yyyy-MM-dd in local calendar */
  dateISO: string;
  /** Short label e.g. Mon */
  dow: string;
  workoutType: string;
  exercises: Exercise[];
  /** User logged completing this calendar day’s scheduled session */
  done?: boolean;
};

/** Legacy v1 single-week blob (Monday-start weeks in older builds). */
export type RoutineStateV1 = {
  weekStartISO: string;
  days: DayPlan[];
  routineSet: boolean;
};

export type WeekRecord = {
  days: DayPlan[];
  routineSet: boolean;
  updatedAt: string;
};

export type AppPersistV2 = {
  version: 2;
  /** Key = Sunday yyyy-MM-dd (start of visual week, Sun→Sat) */
  weeks: Record<string, WeekRecord>;
};
