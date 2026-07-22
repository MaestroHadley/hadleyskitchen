import { CheckCircle, LockKey, SlidersHorizontal } from "@phosphor-icons/react/dist/ssr";
import { savePlannerSettings } from "@/app/actions";
import { DriveConnection } from "@/components/drive-connection";
import { LogoutButton } from "@/components/logout-button";
import { PageHeader } from "@/components/page-header";
import { getSessionUser, getSettings, isDemoMode } from "@/lib/planner-data";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ google?: string; saved?: string }> }) {
  const params = await searchParams;
  const { supabase, user } = await getSessionUser();
  const settings = await getSettings();
  let bakeryName = "Hadley’s Kitchen";
  if (!isDemoMode() && supabase && user) {
    const { data } = await supabase.from("profiles").select("bakery_name").eq("user_id", user.id).maybeSingle();
    if (data?.bakery_name) bakeryName = data.bakery_name;
  }
  return <>
    <PageHeader eyebrow="Private workspace" title="Account & defaults" description="Keep the planner tailored to the way your bakery works." />
    {params.saved === "1" && <p className="page-success"><CheckCircle weight="fill" />Your defaults were saved.</p>}
    <section className="account-grid"><article className="panel account-card"><span className="feature-icon small"><LockKey weight="duotone" /></span><div><p className="eyebrow">Signed in</p><h2>Your account</h2><p className="muted">{user?.email ?? "Local design preview"}</p></div><LogoutButton /></article><DriveConnection connectedFromCallback={params.google === "connected"} failedFromCallback={params.google === "failed"} /></section>
    <form action={savePlannerSettings} className="panel settings-form"><div className="section-heading"><div><p className="eyebrow">Planning defaults</p><h2>Bakery settings</h2><p className="muted">These values become the starting point for new events.</p></div><span className="feature-icon small"><SlidersHorizontal /></span></div><div className="form-grid three"><label>Bakery name<input name="bakeryName" defaultValue={bakeryName} /></label><label>Starter hydration<div className="number-suffix"><input name="starterHydration" type="number" min="1" max="300" defaultValue={Math.round(settings.starterHydration * 100)} /><span>%</span></div></label><label>Shopping buffer<div className="number-suffix"><input name="shoppingBuffer" type="number" min="0" max="100" defaultValue={Math.round(settings.shoppingBuffer * 100)} /><span>%</span></div></label><label>Starter seed parts<input name="seedParts" type="number" min="0" step="0.1" defaultValue={settings.starterSeedParts ?? 1} /></label><label>Starter flour parts<input name="flourParts" type="number" min="0" step="0.1" defaultValue={settings.starterFlourParts ?? 2} /></label><label>Starter water parts<input name="waterParts" type="number" min="0" step="0.1" defaultValue={settings.starterWaterParts ?? 2} /></label></div><button className="button primary" type="submit">Save defaults</button></form>
    <p className="legal-links"><a href="/privacy">Privacy</a><a href="/terms">Terms</a><span>Your recipes and events are private to your account.</span></p>
  </>;
}
