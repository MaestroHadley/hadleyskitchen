export default function PlannerLoading() {
  return <div className="loading-page" aria-label="Loading your planner" aria-live="polite">
    <div className="loading-line short" /><div className="loading-line title" />
    <div className="loading-grid">{Array.from({ length: 4 }, (_, index) => <div className="loading-card" key={index} />)}</div>
    <div className="loading-panel" />
  </div>;
}
