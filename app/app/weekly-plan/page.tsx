import Link from "next/link";
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
        <Link
          href="/app"
          style={{
            textDecoration: "none",
            color: "#1f2937",
            padding: "10px 14px",
            borderRadius: 999,
            border: "1px solid #d1d5db",
            background: "#ffffff",
            fontWeight: 600,
          }}
        >
          Back to dashboard
        </Link>
      </header>

      <div style={{ marginTop: 18 }}>
        <WeeklyPlanWorkbench />
      </div>
    </main>
  );
}
