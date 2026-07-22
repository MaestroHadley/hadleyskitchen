import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getSessionUser, isDemoMode } from "@/lib/planner-data";

export default async function PlannerLayout({ children }: { children: React.ReactNode }) {
  if (isDemoMode()) return <AppShell email="demo@hadleyskitchen.com">{children}</AppShell>;
  const { user } = await getSessionUser();
  if (!user) redirect("/?auth=required");
  return <AppShell email={user.email ?? "baker"}>{children}</AppShell>;
}
