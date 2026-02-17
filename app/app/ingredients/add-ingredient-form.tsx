"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { UNIT_OPTIONS, type UnitOption } from "@/lib/units";

export default function AddIngredientForm() {
  const supabase = supabaseBrowser();
  const router = useRouter();

  const [name, setName] = useState("");
  const [unitType, setUnitType] = useState<UnitOption>("g");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    const { error: insertError } = await supabase
      .from("ingredients")
      .insert([{ name: name.trim(), unit_type: unitType }]);

    setSaving(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setName("");
    setUnitType("g");
    setSuccess("Ingredient added.");
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
      <h2 style={{ margin: "0 0 8px" }}>Add Ingredient</h2>
      <p style={{ margin: "0 0 16px", color: "#4b5563" }}>
        Choose a canonical unit for totals. Recipe lines can still use cups/tsp/tbsp with conversions.
      </p>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <label style={{ display: "grid", gap: 6, fontWeight: 600 }}>
          Ingredient name
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Bread flour"
            minLength={2}
            required
            style={{
              width: "100%",
              padding: "11px 12px",
              borderRadius: 10,
              border: "1px solid #d1d5db",
              fontSize: 15,
            }}
          />
        </label>

        <label style={{ display: "grid", gap: 6, fontWeight: 600 }}>
          Canonical unit
          <select
            value={unitType}
            onChange={(e) => setUnitType(e.target.value as UnitOption)}
            style={{
              width: "100%",
              padding: "11px 12px",
              borderRadius: 10,
              border: "1px solid #d1d5db",
              fontSize: 15,
              background: "#fff",
            }}
          >
            {UNIT_OPTIONS.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
        </label>

        {error && <p style={{ margin: 0, color: "#b91c1c" }}>{error}</p>}
        {success && <p style={{ margin: 0, color: "#065f46" }}>{success}</p>}

        <button
          type="submit"
          disabled={saving || name.trim().length < 2}
          style={{
            marginTop: 4,
            padding: "11px 12px",
            borderRadius: 10,
            border: "none",
            background: "#1f2937",
            color: "#ffffff",
            fontWeight: 700,
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.8 : 1,
          }}
        >
          {saving ? "Saving..." : "Add ingredient"}
        </button>
      </form>
    </section>
  );
}
