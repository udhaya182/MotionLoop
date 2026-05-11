import type { HistoryEntry } from "../useWeeklyRoutine";

type Props = {
  entries: HistoryEntry[];
  currentSundayISO: string;
  onSelectWeek: (sundayISO: string) => void;
};

export function HistoryView({ entries, currentSundayISO, onSelectWeek }: Props) {
  if (entries.length === 0) {
    return (
      <div className="history-empty">
        <p className="history-empty-title">No weeks saved yet</p>
        <p className="history-empty-text">
          Each week you plan or log in MotionLoop is stored here so you can review progress anytime.
        </p>
      </div>
    );
  }

  return (
    <div className="history-list">
      <p className="history-intro">
        Open any week to see your workout types, exercises, and which days you marked done.
      </p>
      <ul className="history-items">
        {entries.map((e) => {
          const isCurrent = e.sundayISO === currentSundayISO;
          return (
            <li key={e.sundayISO}>
              <button
                type="button"
                className="history-item"
                onClick={() => onSelectWeek(e.sundayISO)}
              >
                <span className="history-item-range">{e.label}</span>
                {isCurrent ? (
                  <span className="history-item-pill">This week</span>
                ) : null}
                <span className="history-item-meta">
                  {e.doneCount}/7 logged · {e.routineSet ? "Routine set" : "Draft"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
