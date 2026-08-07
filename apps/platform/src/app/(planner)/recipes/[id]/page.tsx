import { notFound } from "next/navigation";
import { RecipeEditor } from "@/components/recipe-editor";
import { getRecipe, getRecipeVersions, listRecipeCategories } from "@/lib/planner-data";

export default async function RecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [recipe, versions, categories] = await Promise.all([getRecipe(id), getRecipeVersions(id), listRecipeCategories()]);
  if (!recipe) notFound();
  return <RecipeEditor initialRecipe={recipe} versions={versions as Array<{ id: string; version: number; created_at: string }>} categories={categories} />;
}
