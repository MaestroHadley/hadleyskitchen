import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getSessionUser, isDemoMode } from "@/lib/planner-data";
import { resolveThemeId } from "@/lib/themes";

export default async function PlannerLayout({ children }: { children: React.ReactNode }) {
  if (isDemoMode()) return <AppShell email="demo@hadleyskitchen.com" bakeryName="Juniper Bread Co." themeId="studio">{children}</AppShell>;
  const { supabase, user } = await getSessionUser();
  if (!supabase || !user) redirect("/?auth=required");
  const { data } = await supabase.from("profiles").select("bakery_name, theme_id").eq("user_id", user.id).maybeSingle();
  return <AppShell email={user.email ?? "baker"} bakeryName={data?.bakery_name || "My Bakery"} themeId={resolveThemeId(data?.theme_id)}>{children}</AppShell>;
}
