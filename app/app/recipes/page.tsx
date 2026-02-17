import RecipesWorkbench from "./recipes-workbench";

export default function RecipesPage() {
  return (
    <main style={{ maxWidth: 1120, margin: "36px auto", padding: "0 16px 40px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
        <div>
          <h1 style={{ margin: "0 0 6px", fontSize: 32 }}>Recipes</h1>
          <p style={{ margin: 0, color: "#4b5563" }}>
            Create recipes, write instructions, and build ingredient lines with units.
          </p>
        </div>
      </header>

      <div style={{ marginTop: 18 }}>
        <RecipesWorkbench />
      </div>
    </main>
  );
}
