"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";

type IngredientRow = {
  id: string;
  name: string;
  unit_type: string;
};

type ManageIngredientsListProps = {
  items: IngredientRow[];
};

export default function ManageIngredientsList({ items }: ManageIngredientsListProps) {
  const supabase = supabaseBrowser();
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onDelete(id: string) {
    setBusyId(id);
    setError(null);

    const { error: deleteError } = await supabase.from("ingredients").delete().eq("id", id);
    setBusyId(null);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    router.refresh();
  }

  if (items.length === 0) {
    return <p style={{ margin: 0, color: "#4b5563" }}>No custom ingredients yet. Add one above.</p>;
  }

  return (
    <div style={{ display: "grid", gap: 8 }}>
      {items.map((item) => (
        <div
          key={item.id}
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            padding: "8px 10px",
            background: "#fff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div>
            <strong>{item.name}</strong> <span style={{ color: "#4b5563" }}>({item.unit_type})</span>
          </div>
          <button
            type="button"
            disabled={busyId === item.id}
            onClick={() => void onDelete(item.id)}
            style={{
              padding: "8px 10px",
              borderRadius: 8,
              border: "1px solid #d1d5db",
              background: "#fff",
              cursor: busyId === item.id ? "not-allowed" : "pointer",
              opacity: busyId === item.id ? 0.75 : 1,
            }}
          >
            {busyId === item.id ? "Deleting..." : "Delete"}
          </button>
        </div>
      ))}
      {error && <p style={{ margin: 0, color: "#b91c1c" }}>{error}</p>}
    </div>
  );
}
