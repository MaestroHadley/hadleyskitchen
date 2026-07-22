import { redirect } from "next/navigation";
import { AuthPanel } from "@/components/auth-panel";
import { Brand } from "@/components/brand";
import { getSessionUser, isDemoMode } from "@/lib/planner-data";

export default async function Home({ searchParams }: { searchParams: Promise<{ auth?: string; error?: string; preview?: string }> }) {
  const params = await searchParams;
  if (isDemoMode() && params.preview !== "auth") redirect("/dashboard");
  const { user } = await getSessionUser();
  if (user) redirect("/dashboard");
  const error = params.error === "auth_callback" ? "Google sign-in did not complete. Please try again." : params.auth === "required" ? "Sign in to open your private planner." : undefined;
  return <main className="landing-page">
    <section className="landing-brand"><Brand /><div><p className="eyebrow">Free production planning for market bakers</p><h1>A clearer path from recipe to market.</h1><p>Save your formulas once, plan each bake visually, and walk into production with every number in its place.</p></div><div className="landing-proof"><div><strong>Recipe library</strong><span>Your formulas, always ready</span></div><div><strong>Five calm steps</strong><span>From event details to finish</span></div><div><strong>Useful reports</strong><span>Print, CSV, Docs, and Sheets</span></div></div><blockquote>“The calmest part of market week.”</blockquote></section>
    <section className="landing-panel"><AuthPanel error={error} /><footer><a href="/privacy">Privacy</a><a href="/terms">Terms</a><span>Made for independent bakers</span></footer></section>
  </main>;
}
