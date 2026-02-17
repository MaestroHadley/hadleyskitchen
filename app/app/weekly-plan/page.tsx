import WeeklyPlanWorkbench from "./weekly-plan-workbench";

export default function WeeklyPlanPage() {
  return (
    <main style={{ maxWidth: 1120, margin: "36px auto", padding: "0 16px 40px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
        <div>
          <h1 style={{ margin: "0 0 6px", fontSize: 32 }}>Weekly Plan</h1>
          <p style={{ margin: 0, color: "#4b5563" }}>
            Plan recipe batches for the week and generate aggregate ingredient totals.
          </p>
        </div>
      </header>

      <div style={{ marginTop: 18 }}>
        <WeeklyPlanWorkbench />
      </div>
    </main>
  );
}
