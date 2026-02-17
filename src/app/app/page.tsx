import { supabaseServer } from "@/lib/supabase/server";
import LogoutButton from "./logout-button";

export default async function AppHome() {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();

  return (
    <main style={{ maxWidth: 720, margin: "40px auto", padding: 16 }}>
      <h1>Hadley’s Kitchen Planner</h1>
      <p>Logged in as: {data.user?.email}</p>

      <LogoutButton />
    </main>
  );
}
