import type { AppPersistV2, RoutineStateV1, WeekRecord } from "./types";
import {
  createEmptyWeek,
  mergeDaysByDate,
  parseISO,
  startOfWeekSunday,
  toISODate,
} from "./weekUtils";

const KEY_V1 = "gym-weekly-routine-v1";
const KEY_V2 = "liftloop-v2";

function isV2(x: unknown): x is AppPersistV2 {
  return (
    typeof x === "object" &&
    x !== null &&
    (x as AppPersistV2).version === 2 &&
    typeof (x as AppPersistV2).weeks === "object" &&
    (x as AppPersistV2).weeks !== null
  );
}

function migrateV1ToV2(v1: RoutineStateV1): AppPersistV2 {
  const anchor = v1.days[0]?.dateISO;
  if (!anchor || v1.days.length !== 7) {
    return { version: 2, weeks: {} };
  }
  const sun = startOfWeekSunday(parseISO(anchor));
  const sunISO = toISODate(sun);
  const skeleton = createEmptyWeek(sun);
  const merged = mergeDaysByDate(skeleton, v1.days);
  const rec: WeekRecord = {
    days: merged,
    routineSet: v1.routineSet,
    updatedAt: new Date().toISOString(),
  };
  return { version: 2, weeks: { [sunISO]: rec } };
}

export function loadAppStateV2(): AppPersistV2 {
  try {
    const raw2 = localStorage.getItem(KEY_V2);
    if (raw2) {
      const data = JSON.parse(raw2) as unknown;
      if (isV2(data)) return data;
    }

    const raw1 = localStorage.getItem(KEY_V1);
    if (raw1) {
      const v1 = JSON.parse(raw1) as RoutineStateV1;
      if (v1?.days && Array.isArray(v1.days)) {
        const migrated = migrateV1ToV2(v1);
        saveAppStateV2(migrated);
        return migrated;
      }
    }
  } catch {
    /* ignore */
  }
  return { version: 2, weeks: {} };
}

export function saveAppStateV2(state: AppPersistV2): void {
  localStorage.setItem(KEY_V2, JSON.stringify(state));
}
