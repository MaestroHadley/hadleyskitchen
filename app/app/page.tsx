import { supabaseServer } from "@/lib/supabase/server";
import LogoutButton from "./logout-button";

export default async function AppHome() {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  const navItems = [
    { href: "/app/ingredients", label: "Ingredients" },
    { href: "/app/recipes", label: "Recipes" },
    { href: "/app/weekly-plan", label: "Weekly Plan" },
    { href: "/app/reports", label: "Reports" },
  ];

  return (
    <main style={{ maxWidth: 1040, margin: "36px auto", padding: "0 16px 40px" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 22,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 32 }}>Hadley&apos;s Kitchen Planner</h1>
          <p style={{ margin: "6px 0 0", color: "#4b5563" }}>
            Logged in as: {data.user?.email ?? "Unknown user"}
          </p>
        </div>
        <LogoutButton />
      </header>

      <nav
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          marginBottom: 22,
        }}
      >
        {navItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
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
            {item.label}
          </a>
        ))}
      </nav>

      <section
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: 14,
          boxShadow: "0 14px 32px rgba(17, 24, 39, 0.06)",
          padding: 24,
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: 8 }}>Dashboard</h2>
        <p style={{ margin: 0, color: "#4b5563" }}>
          Start by adding recipes and weekly order quantities. Ingredient totals
          across all planned items will be shown here next.
        </p>
      </section>
    </main>
  );
}
