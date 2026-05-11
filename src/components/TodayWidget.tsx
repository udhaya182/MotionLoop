import type { DayPlan } from "../types";

type Props = {
  expanded: boolean;
  onToggle: () => void;
  todayPlan: DayPlan | null;
};

export function TodayWidget({ expanded, onToggle, todayPlan }: Props) {
  const title = todayPlan?.workoutType?.trim()
    ? todayPlan.workoutType
    : "Rest / plan me";

  return (
    <div className="tw-widget" data-expanded={expanded}>
      <button type="button" className="tw-widget-toggle" onClick={onToggle}>
        <span className="tw-widget-kicker">MotionLoop</span>
        <span className="tw-widget-title">{title}</span>
        <span className="tw-widget-meta">
          {todayPlan && todayPlan.exercises.length > 0
            ? `${todayPlan.exercises.length} exercise${todayPlan.exercises.length === 1 ? "" : "s"}`
            : "Tap to expand"}
        </span>
        <span className="tw-widget-chevron" aria-hidden>
          {expanded ? "▾" : "▴"}
        </span>
      </button>
      {expanded && todayPlan && (
        <ul className="tw-widget-list">
          {todayPlan.exercises.length === 0 ? (
            <li className="tw-widget-empty">No exercises yet — open Plan the day.</li>
          ) : (
            todayPlan.exercises.map((e) => (
              <li key={e.id}>{e.name}</li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
