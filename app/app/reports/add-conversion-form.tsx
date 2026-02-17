"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { UNIT_OPTIONS } from "@/lib/units";

type IngredientOption = {
  id: string;
  name: string;
  unit_type: string;
};

type MissingConversionRow = {
  ingredient_id: string;
  ingredient_name: string;
  from_unit: string;
  to_unit: string;
  line_count: number;
};

type AddConversionFormProps = {
  ingredients: IngredientOption[];
  missing: MissingConversionRow[];
};

export default function AddConversionForm({ ingredients, missing }: AddConversionFormProps) {
  const supabase = supabaseBrowser();
  const router = useRouter();

  const [ingredientId, setIngredientId] = useState<string>(missing[0]?.ingredient_id ?? "");
  const [fromUnit, setFromUnit] = useState<string>(missing[0]?.from_unit ?? "cup");
  const [toUnit, setToUnit] = useState<string>(missing[0]?.to_unit ?? "g");
  const [factor, setFactor] = useState<number>(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function applyMissingRow(row: MissingConversionRow) {
    setIngredientId(row.ingredient_id);
    setFromUnit(row.from_unit);
    setToUnit(row.to_unit);
    setSuccess(null);
    setError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    if (!ingredientId) {
      setSaving(false);
      setError("Choose an ingredient.");
      return;
    }
    if (!(factor > 0)) {
      setSaving(false);
      setError("Factor must be greater than 0.");
      return;
    }

    const { error: insertError } = await supabase.from("ingredient_unit_conversions").insert([
      {
        ingredient_id: ingredientId,
        from_unit: fromUnit,
        to_unit: toUnit,
        factor,
      },
    ]);

    setSaving(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setFactor(1);
    setSuccess("Conversion saved.");
    router.refresh();
  }

  return (
    <section
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        boxShadow: "0 14px 32px rgba(17, 24, 39, 0.06)",
        padding: 20,
      }}
    >
      <h2 style={{ margin: "0 0 8px" }}>Add Conversion Mapping</h2>
      <p style={{ margin: "0 0 14px", color: "#4b5563" }}>
        Save ingredient-specific conversion factors such as 1 cup flour = 120 g.
      </p>

      {missing.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <p style={{ margin: "0 0 8px", color: "#374151", fontWeight: 600 }}>Quick-fill from missing pairs</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {missing.map((row) => (
              <button
                key={`${row.ingredient_id}-${row.from_unit}-${row.to_unit}`}
                type="button"
                onClick={() => applyMissingRow(row)}
                style={{
                  border: "1px solid #d1d5db",
                  background: "#fff",
                  borderRadius: 999,
                  padding: "8px 10px",
                  cursor: "pointer",
                }}
              >
                {row.ingredient_name}: {row.from_unit} -&gt; {row.to_unit}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
        <select
          value={ingredientId}
          onChange={(e) => setIngredientId(e.target.value)}
          style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db" }}
          required
        >
          <option value="">Select ingredient</option>
          {ingredients.map((ingredient) => (
            <option key={ingredient.id} value={ingredient.id}>
              {ingredient.name} ({ingredient.unit_type})
            </option>
          ))}
        </select>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <select
            value={fromUnit}
            onChange={(e) => setFromUnit(e.target.value)}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db" }}
          >
            {UNIT_OPTIONS.map((unit) => (
              <option key={`from-${unit}`} value={unit}>
                from: {unit}
              </option>
            ))}
          </select>

          <select
            value={toUnit}
            onChange={(e) => setToUnit(e.target.value)}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db" }}
          >
            {UNIT_OPTIONS.map((unit) => (
              <option key={`to-${unit}`} value={unit}>
                to: {unit}
              </option>
            ))}
          </select>

          <input
            type="number"
            min={0.000001}
            step="0.000001"
            value={factor}
            onChange={(e) => setFactor(Number(e.target.value))}
            placeholder="factor"
            style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db" }}
            required
          />
        </div>

        {error && <p style={{ margin: 0, color: "#b91c1c" }}>{error}</p>}
        {success && <p style={{ margin: 0, color: "#065f46" }}>{success}</p>}

        <button
          type="submit"
          disabled={saving}
          style={{
            width: "fit-content",
            padding: "10px 12px",
            borderRadius: 10,
            border: "none",
            background: "var(--hk-button)",
            color: "#fff",
            fontWeight: 700,
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.8 : 1,
          }}
        >
          {saving ? "Saving..." : "Save conversion"}
        </button>
      </form>
    </section>
  );
}
