import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import AddConversionForm from "./add-conversion-form";
import { ALLERGEN_TAG_OPTIONS, DIETARY_TAG_OPTIONS } from "@/lib/recipe-tags";

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

type ReportsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function toArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const supabase = await supabaseServer();
  const params = await searchParams;
  const selectedAllergens = toArray(params.allergen);
  const selectedDietary = toArray(params.dietary);

  const [{ data: missingData, error: missingError }, { data: ingredientData, error: ingredientError }] =
    await Promise.all([
      supabase.rpc("get_missing_conversions", {
        p_allergen_filter: selectedAllergens,
        p_dietary_filter: selectedDietary,
      }),
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
          <h2 style={{ margin: "0 0 8px" }}>Filter by Recipe Tags</h2>
          <form method="get" style={{ display: "grid", gap: 10 }}>
            <div style={{ color: "#6b7280", fontSize: 13 }}>Allergen tags</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {ALLERGEN_TAG_OPTIONS.map((tag) => (
                <label key={`allergen-${tag}`} style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                  <input type="checkbox" name="allergen" value={tag} defaultChecked={selectedAllergens.includes(tag)} />
                  {tag}
                </label>
              ))}
            </div>
            <div style={{ color: "#6b7280", fontSize: 13 }}>Dietary tags</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {DIETARY_TAG_OPTIONS.map((tag) => (
                <label key={`dietary-${tag}`} style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                  <input type="checkbox" name="dietary" value={tag} defaultChecked={selectedDietary.includes(tag)} />
                  {tag}
                </label>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="submit"
                style={{
                  width: "fit-content",
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "none",
                  background: "#1f2937",
                  color: "#fff",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Apply filters
              </button>
              <Link
                href="/app/reports"
                style={{
                  textDecoration: "none",
                  color: "#1f2937",
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid #d1d5db",
                  background: "#fff",
                  fontWeight: 700,
                }}
              >
                Clear
              </Link>
            </div>
          </form>
        </section>

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
