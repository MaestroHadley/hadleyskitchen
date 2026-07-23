"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { sampleEvent, sampleRecipes, sampleSchedule } from "@/data/sample";
import { getRecipe, getSessionUser, isDemoMode } from "@/lib/planner-data";
import type { EventQaChecks, PlannerEvent, Recipe } from "@/lib/planner";

const ingredientSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1).max(120),
  grams: z.number().finite().min(0).max(1_000_000),
  role: z.enum(["flour", "water", "active_starter", "discard", "inclusion", "other"]),
  packageGrams: z.number().finite().positive().max(1_000_000).optional(),
});

const recipeSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(120),
  category: z.string().trim().min(1).max(80),
  yieldPerBatch: z.number().finite().positive().max(100_000),
  yieldLabel: z.string().trim().min(1).max(40),
  ovenCapacity: z.number().finite().positive().max(100_000),
  cycleMinutes: z.number().int().positive().max(1440),
  notes: z.string().max(5000).optional(),
  ingredients: z.array(ingredientSchema).min(1).max(200),
});

const qaChecksSchema = z.object({
  quantities: z.boolean(),
  starter: z.boolean(),
  shopping: z.boolean(),
  oven: z.boolean(),
  finalCount: z.boolean(),
});

const eventSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(120),
  eventAt: z.string().datetime({ offset: true }).nullable(),
  shoppingBuffer: z.number().min(0).max(1),
  starterHydration: z.number().positive().max(3),
  items: z.array(z.object({ recipeId: z.string().min(1), target: z.number().min(0), policy: z.enum(["whole", "exact"]) })).max(250),
  schedule: z.array(z.object({ dayLabel: z.string().max(80), title: z.string().max(160), notes: z.string().max(1000), sortOrder: z.number().int() })).max(100),
  qaChecks: qaChecksSchema,
});

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

export async function saveRecipe(input: Recipe): Promise<ActionResult> {
  const parsed = recipeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the recipe fields." };
  if (isDemoMode()) return { ok: true, id: input.id };
  const { supabase, user } = await getSessionUser();
  if (!supabase || !user) return { ok: false, error: "Sign in to save recipes." };
  const { error } = await supabase.rpc("save_recipe", {
    p_recipe_id: input.id,
    p_name: parsed.data.name,
    p_category: parsed.data.category,
    p_yield_per_batch: parsed.data.yieldPerBatch,
    p_yield_label: parsed.data.yieldLabel,
    p_oven_capacity: parsed.data.ovenCapacity,
    p_cycle_minutes: parsed.data.cycleMinutes,
    p_notes: parsed.data.notes ?? "",
    p_ingredients: parsed.data.ingredients.map((ingredient, index) => ({ ...ingredient, sortOrder: index })),
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/recipes");
  revalidatePath(`/recipes/${input.id}`);
  return { ok: true, id: input.id };
}

export async function createRecipe(): Promise<ActionResult> {
  if (isDemoMode()) return { ok: true, id: "plain" };
  const { supabase, user } = await getSessionUser();
  if (!supabase || !user) return { ok: false, error: "Sign in to create a recipe." };
  const { data, error } = await supabase.from("recipes").insert({ user_id: user.id, name: "Untitled recipe", category: "Bread", yield_per_batch: 1, yield_label: "items", oven_capacity: 1, cycle_minutes: 30 }).select("id").single();
  if (error || !data) return { ok: false, error: error?.message ?? "Could not create recipe." };
  await supabase.from("recipe_ingredients").insert({ user_id: user.id, recipe_id: data.id, name: "Flour", grams: 0, role: "flour", sort_order: 0 });
  revalidatePath("/recipes");
  return { ok: true, id: data.id };
}

export async function duplicateRecipe(id: string): Promise<ActionResult> {
  const source = await getRecipe(id);
  if (!source) return { ok: false, error: "Recipe not found." };
  if (isDemoMode()) return { ok: true, id: source.id };
  const { supabase, user } = await getSessionUser();
  if (!supabase || !user) return { ok: false, error: "Sign in to duplicate recipes." };
  const { data, error } = await supabase.from("recipes").insert({ user_id: user.id, name: `${source.name} copy`, category: source.category, yield_per_batch: source.yieldPerBatch, yield_label: source.yieldLabel, oven_capacity: source.ovenCapacity, cycle_minutes: source.cycleMinutes, notes: source.notes ?? "" }).select("id").single();
  if (error || !data) return { ok: false, error: error?.message ?? "Could not duplicate recipe." };
  await supabase.from("recipe_ingredients").insert(source.ingredients.map((ingredient, index) => ({ user_id: user.id, recipe_id: data.id, name: ingredient.name, grams: ingredient.grams, role: ingredient.role, package_grams: ingredient.packageGrams ?? null, sort_order: index })));
  revalidatePath("/recipes");
  return { ok: true, id: data.id };
}

export async function setRecipeFlags(id: string, changes: { favorite?: boolean; archived?: boolean }): Promise<ActionResult> {
  if (isDemoMode()) return { ok: true, id };
  const { supabase, user } = await getSessionUser();
  if (!supabase || !user) return { ok: false, error: "Sign in to update recipes." };
  const values: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof changes.favorite === "boolean") values.is_favorite = changes.favorite;
  if (typeof changes.archived === "boolean") values.archived_at = changes.archived ? new Date().toISOString() : null;
  const { error } = await supabase.from("recipes").update(values).eq("id", id).eq("user_id", user.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/recipes");
  revalidatePath(`/recipes/${id}`);
  return { ok: true, id };
}

export async function createEvent(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim() || "New market";
  const date = String(formData.get("date") ?? "");
  if (isDemoMode()) redirect("/events/sample/plan");
  const { supabase, user } = await getSessionUser();
  if (!supabase || !user) redirect("/?auth=required");
  const { data, error } = await supabase.from("events").insert({ user_id: user.id, name: name.slice(0, 120), event_at: date ? new Date(`${date}T09:00:00`).toISOString() : null }).select("id").single();
  if (error || !data) redirect("/dashboard?event=failed");
  redirect(`/events/${data.id}/plan`);
}

export async function saveEventPlan(input: PlannerEvent): Promise<ActionResult> {
  const parsed = eventSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the event fields." };
  if (isDemoMode()) return { ok: true, id: input.id };
  const { supabase, user } = await getSessionUser();
  if (!supabase || !user) return { ok: false, error: "Sign in to save this event." };
  const { error } = await supabase.rpc("save_event_plan", {
    p_event_id: parsed.data.id,
    p_name: parsed.data.name,
    p_event_at: parsed.data.eventAt,
    p_shopping_buffer: parsed.data.shoppingBuffer,
    p_starter_hydration: parsed.data.starterHydration,
    p_items: parsed.data.items.map((item, index) => ({ ...item, sortOrder: index })),
    p_schedule: parsed.data.schedule,
  });
  if (error) return { ok: false, error: error.message };
  const { error: qaError } = await supabase.from("events").update({ qa_checks: parsed.data.qaChecks }).eq("id", input.id).eq("user_id", user.id);
  if (qaError) return { ok: false, error: qaError.message };
  revalidatePath(`/events/${input.id}/plan`);
  revalidatePath(`/events/${input.id}/report`);
  revalidatePath("/dashboard");
  revalidatePath("/events");
  return { ok: true, id: input.id };
}

export async function finishEvent(input: PlannerEvent): Promise<ActionResult> {
  const saved = await saveEventPlan(input);
  if (!saved.ok) return saved;
  if (isDemoMode()) return { ok: true, id: input.id };
  const { supabase, user } = await getSessionUser();
  if (!supabase || !user) return { ok: false, error: "Sign in to finish this event." };
  const { error } = await supabase.rpc("finalize_event", { p_event_id: input.id });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/events/${input.id}/plan`);
  revalidatePath(`/events/${input.id}/report`);
  revalidatePath("/dashboard");
  revalidatePath("/events");
  return { ok: true, id: input.id };
}

export async function reopenEvent(id: string): Promise<ActionResult> {
  if (isDemoMode()) return { ok: true, id };
  const { supabase, user } = await getSessionUser();
  if (!supabase || !user) return { ok: false, error: "Sign in to reopen this plan." };
  const { error } = await supabase.rpc("reopen_event", { p_event_id: id });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/events/${id}/plan`);
  revalidatePath(`/events/${id}/report`);
  revalidatePath("/events");
  return { ok: true, id };
}

export async function saveEventQaChecks(id: string, checks: EventQaChecks): Promise<ActionResult> {
  const parsed = z.object({
    id: z.string().uuid(),
    checks: qaChecksSchema,
  }).safeParse({ id, checks });
  if (!parsed.success) return { ok: false, error: "Check the production checklist values." };
  if (isDemoMode()) return { ok: true, id };
  const { supabase, user } = await getSessionUser();
  if (!supabase || !user) return { ok: false, error: "Sign in to update this event." };
  const { data, error } = await supabase.from("events")
    .update({ qa_checks: parsed.data.checks, updated_at: new Date().toISOString() })
    .eq("id", parsed.data.id)
    .eq("user_id", user.id)
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "Could not save the checklist." };
  revalidatePath(`/events/${id}/report`);
  revalidatePath("/events");
  return { ok: true, id };
}

export async function deleteEventPermanently(input: { eventId: string; eventName: string; acknowledged: boolean }): Promise<ActionResult> {
  const parsed = z.object({
    eventId: z.string().uuid(),
    eventName: z.string().trim().min(1).max(120),
    acknowledged: z.literal(true),
  }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Confirm the event name and permanent deletion." };
  if (isDemoMode()) return { ok: true, id: input.eventId };
  const { supabase, user } = await getSessionUser();
  if (!supabase || !user) return { ok: false, error: "Sign in to delete this event." };
  const { data: event, error: eventError } = await supabase.from("events")
    .select("id, name")
    .eq("id", parsed.data.eventId)
    .eq("user_id", user.id)
    .single();
  if (eventError || !event) return { ok: false, error: "Event not found." };
  if (event.name !== parsed.data.eventName) return { ok: false, error: "The event name does not match." };
  const { error } = await supabase.rpc("delete_event_with_archive", { p_event_id: parsed.data.eventId });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/events");
  revalidatePath("/dashboard");
  return { ok: true, id: parsed.data.eventId };
}

async function insertRecipe(source: Recipe, userId: string, supabase: NonNullable<Awaited<ReturnType<typeof getSessionUser>>["supabase"]>) {
  const { data, error } = await supabase.from("recipes").insert({ user_id: userId, name: source.name, category: source.category, yield_per_batch: source.yieldPerBatch, yield_label: source.yieldLabel, oven_capacity: source.ovenCapacity, cycle_minutes: source.cycleMinutes, notes: source.notes ?? "", is_favorite: source.isFavorite ?? false }).select("id").single();
  if (error || !data) throw new Error(error?.message ?? "Could not add sample recipe.");
  await supabase.from("recipe_ingredients").insert(source.ingredients.map((ingredient, index) => ({ user_id: userId, recipe_id: data.id, name: ingredient.name, grams: ingredient.grams, role: ingredient.role, package_grams: ingredient.packageGrams ?? null, sort_order: index })));
  return data.id as string;
}

export async function seedSampleWorkspace() {
  if (isDemoMode()) redirect("/dashboard");
  const { supabase, user } = await getSessionUser();
  if (!supabase || !user) redirect("/?auth=required");
  const recipeIds = new Map<string, string>();
  for (const recipe of sampleRecipes) recipeIds.set(recipe.id, await insertRecipe(recipe, user.id, supabase));
  const { data: event } = await supabase.from("events").insert({ user_id: user.id, name: "Saturday Pop-Up", event_at: "2026-07-25T16:00:00.000Z", shopping_buffer: 0.1, starter_hydration: 1 }).select("id").single();
  if (event) await supabase.rpc("save_event_plan", { p_event_id: event.id, p_name: "Saturday Pop-Up", p_event_at: "2026-07-25T16:00:00.000Z", p_shopping_buffer: 0.1, p_starter_hydration: 1, p_items: sampleEvent.map((item, index) => ({ ...item, recipeId: recipeIds.get(item.recipeId), sortOrder: index })), p_schedule: sampleSchedule });
  revalidatePath("/dashboard");
  redirect("/dashboard?sample=ready");
}

export async function startCleanWorkspace() {
  redirect("/recipes?welcome=clean");
}

export async function savePlannerSettings(formData: FormData) {
  if (isDemoMode()) redirect("/account?saved=1");
  const { supabase, user } = await getSessionUser();
  if (!supabase || !user) redirect("/?auth=required");
  const bakeryName = String(formData.get("bakeryName") ?? "").trim().slice(0, 120) || "My Bakery";
  const starterHydration = Math.min(3, Math.max(0.01, Number(formData.get("starterHydration") ?? 100) / 100));
  const shoppingBuffer = Math.min(1, Math.max(0, Number(formData.get("shoppingBuffer") ?? 10) / 100));
  const seedParts = Math.max(0, Number(formData.get("seedParts") ?? 1));
  const flourParts = Math.max(0, Number(formData.get("flourParts") ?? 2));
  const waterParts = Math.max(0, Number(formData.get("waterParts") ?? 2));
  await Promise.all([
    supabase.from("profiles").upsert({ user_id: user.id, bakery_name: bakeryName, updated_at: new Date().toISOString() }),
    supabase.from("planner_settings").upsert({ user_id: user.id, starter_hydration: starterHydration, shopping_buffer: shoppingBuffer, starter_seed_parts: seedParts, starter_flour_parts: flourParts, starter_water_parts: waterParts }),
  ]);
  revalidatePath("/account");
  redirect("/account?saved=1");
}
