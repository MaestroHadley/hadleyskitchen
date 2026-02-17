import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import AddConversionForm from "./add-conversion-form";

type MissingConversionRow = {
  ingredient_id: string;
  ingredient_name: string;
  from_unit: string;
  to_unit: string;
  line_count: number;
};

type IngredientOption = {
  id: string;
  name: string;
  unit_type: string;
};

export default async function ReportsPage() {
  const supabase = await supabaseServer();

  const [{ data: missingData, error: missingError }, { data: ingredientData, error: ingredientError }] =
    await Promise.all([
      supabase.rpc("get_missing_conversions"),
      supabase.from("ingredients").select("id,name,unit_type").order("name", { ascending: true }),
    ]);

  const missing = (missingData ?? []) as MissingConversionRow[];
  const ingredients = (ingredientData ?? []) as IngredientOption[];

  return (
    <main style={{ maxWidth: 1120, margin: "36px auto", padding: "0 16px 40px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
        <div>
          <h1 style={{ margin: "0 0 6px", fontSize: 32 }}>Reports</h1>
          <p style={{ margin: 0, color: "#4b5563" }}>
            Resolve missing ingredient conversions used by your recipe lines.
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

      <div style={{ marginTop: 18, display: "grid", gap: 18 }}>
        <section
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 14,
            boxShadow: "0 14px 32px rgba(17, 24, 39, 0.06)",
            padding: 20,
          }}
        >
          <h2 style={{ margin: "0 0 8px" }}>Missing Conversions</h2>
          {missing.length === 0 ? (
            <p style={{ margin: 0, color: "#065f46" }}>
              No missing conversions detected from your recipe lines.
            </p>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {missing.map((row) => (
                <div
                  key={`${row.ingredient_id}-${row.from_unit}-${row.to_unit}`}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 10,
                    padding: "10px 12px",
                    background: "#fff",
                  }}
                >
                  <strong>{row.ingredient_name}</strong>
                  <div style={{ color: "#4b5563" }}>
                    Missing: {row.from_unit} -&gt; {row.to_unit} ({row.line_count} line
                    {row.line_count === 1 ? "" : "s"})
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <AddConversionForm ingredients={ingredients} missing={missing} />
      </div>

      {(missingError || ingredientError) && (
        <p style={{ marginTop: 16, color: "#b91c1c" }}>
          {missingError?.message ?? ingredientError?.message}
        </p>
      )}
    </main>
  );
}
