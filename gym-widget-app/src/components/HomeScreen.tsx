import { useEffect, useMemo, useState } from "react";
import type { DayPlan } from "../types";
import { TodayWidget } from "./TodayWidget";

const WORKOUT_PRESETS = [
  "Push",
  "Pull",
  "Leg day",
  "Upper",
  "Lower",
  "Cardio",
  "Abs",
  "Swim",
  "Rest",
] as const;

type Props = {
  todayISO: string;
  weekLabel: string;
  days: DayPlan[];
  routineSet: boolean;
  readOnly?: boolean;
  /** When false, hide the bottom glance strip (e.g. past weeks that aren’t this week) */
  showTodayWidget?: boolean;
  onSetWorkout: (dayIndex: number, type: string) => void;
  onAddExercise: (dayIndex: number, name: string) => void;
  onRemoveExercise: (dayIndex: number, exerciseId: string) => void;
  onUpdateExerciseBest: (
    dayIndex: number,
    exerciseId: string,
    patch: { bestWeight?: number | null; unit?: "lb" | "kg" }
  ) => void;
  onCommitRoutine: () => void;
  onMarkDayDone: (dayIndex: number) => void;
  onMarkSkippedWorkout: (dayIndex: number) => void;
};

export function HomeScreen({
  todayISO,
  weekLabel,
  days,
  routineSet,
  readOnly = false,
  showTodayWidget = true,
  onSetWorkout,
  onAddExercise,
  onRemoveExercise,
  onUpdateExerciseBest,
  onCommitRoutine,
  onMarkDayDone,
  onMarkSkippedWorkout,
}: Props) {
  const todayIndex = useMemo(
    () => days.findIndex((d) => d.dateISO === todayISO),
    [days, todayISO]
  );

  const [selectedIndex, setSelectedIndex] = useState(() =>
    todayIndex >= 0 ? todayIndex : 0
  );

  const [planOpen, setPlanOpen] = useState(!readOnly);
  const [editMode, setEditMode] = useState(!routineSet && !readOnly);
  const [customType, setCustomType] = useState("");
  const [exerciseDraft, setExerciseDraft] = useState("");
  const [widgetExpanded, setWidgetExpanded] = useState(true);
  const [scheduleNotice, setScheduleNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!scheduleNotice) return;
    const t = window.setTimeout(() => setScheduleNotice(null), 5500);
    return () => window.clearTimeout(t);
  }, [scheduleNotice]);

  const selected = days[selectedIndex] ?? days[0];
  const todayPlan = todayIndex >= 0 ? days[todayIndex]! : null;

  const headerDate = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }, []);

  const doneCount = useMemo(
    () => days.filter((d) => d.done).length,
    [days]
  );

  const canEdit = !readOnly && (!routineSet || editMode);
  const canEditWeights = !readOnly;
  const hasPlannedWork =
    Boolean(selected.workoutType?.trim()) &&
    selected.workoutType.trim().toLowerCase() !== "rest";

  const applyPreset = (label: string) => {
    onSetWorkout(selectedIndex, label);
  };

  const saveCustomType = () => {
    const t = customType.trim();
    if (!t) return;
    onSetWorkout(selectedIndex, t);
    setCustomType("");
  };

  const addExerciseFromField = () => {
    onAddExercise(selectedIndex, exerciseDraft);
    setExerciseDraft("");
  };

  const handleSkipped = () => {
    onMarkSkippedWorkout(selectedIndex);
    setScheduleNotice(
      "Skipped — that session moves to the next day; nothing shifts backward."
    );
  };

  const handleDone = () => {
    if (selected.exercises.length > 0) {
      const missing = selected.exercises.some(
        (e) => e.bestWeight === null || e.bestWeight === undefined
      );
      if (missing) {
        setPlanOpen(true);
        setScheduleNotice(
          "Add your best weight (lb/kg) for each exercise before marking done."
        );
        return;
      }
    }
    onMarkDayDone(selectedIndex);
  };

  return (
    <div className="home" data-readonly={readOnly}>
      <header className="home-header">
        <p className="brand-name">MotionLoop</p>
        {readOnly ? (
          <p className="history-subheader">Saved week · view only</p>
        ) : null}
        <p className="home-date">{headerDate}</p>
        <p className="home-week-range">{weekLabel}</p>
        {!readOnly ? (
          <p className="brand-tagline">
            Sun→Sat week. Skip a day and that workout carries to the next day — calendar stays fixed.
          </p>
        ) : (
          <p className="brand-tagline muted">
            Workouts and checkmarks are preserved as you left them.
          </p>
        )}
      </header>

      <div className="week-strip" role="tablist" aria-label="Week schedule Sun to Sat">
        {days.map((d, i) => {
          const isToday = d.dateISO === todayISO;
          const dom = parseInt(d.dateISO.slice(-2), 10);
          const active = i === selectedIndex;
          return (
            <button
              key={d.dateISO}
              type="button"
              role="tab"
              aria-selected={active}
              className="week-day"
              data-today={isToday}
              data-active={active}
              data-done={Boolean(d.done)}
              onClick={() => setSelectedIndex(i)}
            >
              <span className="week-dow">{d.dow}</span>
              <span className="week-num">{dom}</span>
              {d.done ? (
                <span className="week-check" title="Logged done">
                  ✓
                </span>
              ) : d.workoutType ? (
                <span className="week-dot" title={d.workoutType} />
              ) : null}
            </button>
          );
        })}
      </div>

      <section className="day-card">
        <div className="day-card-head">
          <div>
            <h1 className="day-title">
              {selected.workoutType?.trim()
                ? selected.workoutType
                : "Pick a focus"}
            </h1>
            <p className="day-sub">
              {selected.dow} ·{" "}
              {new Date(
                parseInt(selected.dateISO.slice(0, 4), 10),
                parseInt(selected.dateISO.slice(5, 7), 10) - 1,
                parseInt(selected.dateISO.slice(8, 10), 10)
              ).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>
          {routineSet && (
            <span className="badge" data-on={routineSet}>
              Routine locked
            </span>
          )}
        </div>

        {readOnly && routineSet && (
          <p className="history-week-summary">
            {doneCount} of 7 days marked done this week
          </p>
        )}

        {routineSet && !readOnly && (
          <div className="session-tracker">
            <p className="session-tracker-label">This day</p>
            <div className="session-tracker-actions">
              <button
                type="button"
                className="btn btn-done"
                disabled={!hasPlannedWork || Boolean(selected.done)}
                onClick={handleDone}
              >
                {selected.done ? "Logged done" : "Mark done"}
              </button>
              <button
                type="button"
                className="btn btn-skip"
                disabled={!hasPlannedWork}
                onClick={handleSkipped}
              >
                Skipped workout
              </button>
            </div>
            <p className="session-tracker-hint">
              Skipped workouts move to the next calendar day (Sat wraps to Sun). Earlier days stay as they were.
            </p>
          </div>
        )}

        <div className="actions-row">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setPlanOpen((v) => !v)}
          >
            {readOnly
              ? planOpen
                ? "Hide plan"
                : "View plan"
              : planOpen
                ? "Hide planner"
                : "Plan the day"}
          </button>
          {routineSet && !readOnly && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setEditMode((e) => !e)}
            >
              {editMode ? "Done editing" : "Edit routine"}
            </button>
          )}
        </div>

        {planOpen && (
          <div className="planner">
            <p className="planner-label">Workout type</p>
            <div className="chip-grid">
              {WORKOUT_PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  className="chip"
                  disabled={!canEdit}
                  data-selected={
                    selected.workoutType.trim().toLowerCase() === p.toLowerCase()
                  }
                  onClick={() => applyPreset(p)}
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="inline-field">
              <input
                className="field"
                placeholder="Custom (e.g. HIIT, Sports…)"
                value={customType}
                disabled={!canEdit}
                onChange={(e) => setCustomType(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveCustomType();
                }}
              />
              <button
                type="button"
                className="btn btn-secondary"
                disabled={!canEdit}
                onClick={saveCustomType}
              >
                Set
              </button>
            </div>

            <p className="planner-label">Exercises for this day</p>
            <div className="inline-field">
              <input
                className="field"
                placeholder='e.g. "Lat pulldowns"'
                value={exerciseDraft}
                disabled={!canEdit}
                onChange={(e) => setExerciseDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addExerciseFromField();
                }}
              />
              <button
                type="button"
                className="btn btn-secondary"
                disabled={!canEdit}
                onClick={addExerciseFromField}
              >
                Add
              </button>
            </div>

            <ul className="ex-list">
              {selected.exercises.length === 0 ? (
                <li className="ex-empty">No exercises yet.</li>
              ) : (
                selected.exercises.map((ex) => (
                  <li key={ex.id} className="ex-item">
                    <div className="ex-left">
                      <span className="ex-name">{ex.name}</span>
                      <span className="ex-sub">
                        Best:{" "}
                        {ex.bestWeight != null
                          ? `${ex.bestWeight} ${ex.unit ?? "lb"}`
                          : "—"}
                      </span>
                    </div>

                    <div className="ex-right">
                      <input
                        className="field ex-weight"
                        inputMode="decimal"
                        type="number"
                        step="0.5"
                        min="0"
                        placeholder="0"
                        value={ex.bestWeight ?? ""}
                        disabled={!canEditWeights}
                        onChange={(e) => {
                          const v = e.target.value;
                          onUpdateExerciseBest(
                            selectedIndex,
                            ex.id,
                            { bestWeight: v === "" ? null : Number(v) }
                          );
                        }}
                      />
                      <select
                        className="ex-unit"
                        value={ex.unit ?? "lb"}
                        disabled={!canEditWeights}
                        onChange={(e) =>
                          onUpdateExerciseBest(
                            selectedIndex,
                            ex.id,
                            { unit: e.target.value as "lb" | "kg" }
                          )
                        }
                      >
                        <option value="lb">lb</option>
                        <option value="kg">kg</option>
                      </select>

                      {canEdit && (
                        <button
                          type="button"
                          className="btn-icon"
                          aria-label={`Remove ${ex.name}`}
                          onClick={() => onRemoveExercise(selectedIndex, ex.id)}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </section>

      {scheduleNotice && !readOnly && (
        <div className="notice-banner" role="status">
          {scheduleNotice}
        </div>
      )}

      {!readOnly && (
        <div className="routine-bar">
          <button
            type="button"
            className="btn btn-accent wide"
            disabled={routineSet && !editMode}
            onClick={() => {
              onCommitRoutine();
              setEditMode(false);
            }}
          >
            {routineSet && !editMode
              ? "Routine saved ✓"
              : routineSet && editMode
                ? "Save routine"
                : "Set routine"}
          </button>
        </div>
      )}

      {showTodayWidget && (
        <TodayWidget
          expanded={widgetExpanded}
          onToggle={() => setWidgetExpanded((v) => !v)}
          todayPlan={todayPlan}
        />
      )}
    </div>
  );
}
