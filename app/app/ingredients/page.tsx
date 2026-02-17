import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import AddIngredientForm from "./add-ingredient-form";
import ManageIngredientsList from "./manage-ingredients-list";

type IngredientRow = {
  id: string;
  name: string;
  unit_type: string;
  owner_id: string | null;
};

export default async function IngredientsPage() {
  const supabase = await supabaseServer();
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData.user?.id ?? null;

  const { data, error } = await supabase
    .from("ingredients")
    .select("id,name,unit_type,owner_id")
    .order("name", { ascending: true });

  const ingredients = (data ?? []) as IngredientRow[];
  const myIngredients = ingredients.filter((item) => item.owner_id && item.owner_id === userId);
  const sharedIngredients = ingredients.filter((item) => item.owner_id === null);

  return (
    <main style={{ maxWidth: 1040, margin: "36px auto", padding: "0 16px 40px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
        <div>
          <h1 style={{ margin: "0 0 6px", fontSize: 32 }}>Ingredients</h1>
          <p style={{ margin: 0, color: "#4b5563" }}>
            Manage your custom ingredients and browse shared baking defaults.
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
        <AddIngredientForm />

        <section
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 14,
            boxShadow: "0 14px 32px rgba(17, 24, 39, 0.06)",
            padding: 20,
          }}
        >
          <h2 style={{ margin: "0 0 10px" }}>Your Ingredients</h2>
          <ManageIngredientsList items={myIngredients} />
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
          <h2 style={{ margin: "0 0 10px" }}>Shared Defaults</h2>
          {sharedIngredients.length === 0 ? (
            <p style={{ margin: 0, color: "#4b5563" }}>
              No shared defaults visible yet. Run the latest ingredient seed migration in Supabase.
            </p>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6 }}>
              {sharedIngredients.map((item) => (
                <li key={item.id}>
                  <strong>{item.name}</strong> <span style={{ color: "#4b5563" }}>({item.unit_type})</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {error && (
        <p style={{ color: "#b91c1c", marginTop: 16 }}>
          Failed to load ingredients: {error.message}
        </p>
      )}
    </main>
  );
}
