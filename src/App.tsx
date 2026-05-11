import { useState } from "react";
import { HistoryView } from "./components/HistoryView";
import { HomeScreen } from "./components/HomeScreen";
import { weekRangeLabel } from "./weekUtils";
import { useWeeklyRoutine } from "./useWeeklyRoutine";

type Tab = "week" | "history";

export default function App() {
  const [tab, setTab] = useState<Tab>("week");
  const [historyWeekISO, setHistoryWeekISO] = useState<string | null>(null);

  const {
    todayISO,
    calendarSundayISO,
    weekLabel,
    days,
    routineSet,
    setWorkoutType,
    addExercise,
    removeExercise,
    updateExerciseBest,
    commitRoutine,
    markDayDone,
    markSkippedWorkout,
    historyEntries,
    getWeekRecord,
  } = useWeeklyRoutine();

  const historyRecord = historyWeekISO ? getWeekRecord(historyWeekISO) : undefined;
  const historyWeekShowsWidget = Boolean(
    historyRecord?.days.some((d) => d.dateISO === todayISO)
  );
  const tightBottom =
    tab === "history" && (!historyWeekISO || !historyWeekShowsWidget);

  return (
    <div className={`app-shell${tightBottom ? " app-shell-tight" : ""}`}>
      <nav className="app-tabs" aria-label="Main">
        <button
          type="button"
          className="app-tab"
          data-active={tab === "week"}
          onClick={() => {
            setTab("week");
            setHistoryWeekISO(null);
          }}
        >
          Week
        </button>
        <button
          type="button"
          className="app-tab"
          data-active={tab === "history"}
          onClick={() => {
            setTab("history");
            setHistoryWeekISO(null);
          }}
        >
          History
        </button>
      </nav>

      {tab === "week" && (
        <HomeScreen
          key="week-live"
          todayISO={todayISO}
          weekLabel={weekLabel}
          days={days}
          routineSet={routineSet}
          readOnly={false}
          showTodayWidget
          onSetWorkout={setWorkoutType}
          onAddExercise={addExercise}
          onRemoveExercise={removeExercise}
          onUpdateExerciseBest={updateExerciseBest}
          onCommitRoutine={commitRoutine}
          onMarkDayDone={markDayDone}
          onMarkSkippedWorkout={markSkippedWorkout}
        />
      )}

      {tab === "history" && !historyWeekISO && (
        <div className="history-panel">
          <HistoryView
            entries={historyEntries}
            currentSundayISO={calendarSundayISO}
            onSelectWeek={(iso) => setHistoryWeekISO(iso)}
          />
        </div>
      )}

      {tab === "history" && historyWeekISO && historyRecord && (
        <div className="history-detail">
          <div className="history-detail-bar">
            <button
              type="button"
              className="btn btn-ghost history-back"
              onClick={() => setHistoryWeekISO(null)}
            >
              ← All weeks
            </button>
            <span className="history-detail-label">
              {historyWeekISO === calendarSundayISO ? "This week" : "Past week"}
            </span>
          </div>
          <HomeScreen
            key={historyWeekISO}
            todayISO={todayISO}
            weekLabel={weekRangeLabel(historyWeekISO)}
            days={historyRecord.days}
            routineSet={historyRecord.routineSet}
            readOnly
            showTodayWidget={historyWeekShowsWidget}
            onSetWorkout={setWorkoutType}
            onAddExercise={addExercise}
            onRemoveExercise={removeExercise}
            onUpdateExerciseBest={updateExerciseBest}
            onCommitRoutine={commitRoutine}
            onMarkDayDone={markDayDone}
            onMarkSkippedWorkout={markSkippedWorkout}
          />
        </div>
      )}
    </div>
  );
}
