import { CreateRecipeButton } from "@/components/create-recipe-button";
import { PageHeader } from "@/components/page-header";
import { RecipeLibrary } from "@/components/recipe-library";
import { listRecipes, type RecipeFilters } from "@/lib/planner-data";

export default async function RecipesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const filters: Required<Pick<RecipeFilters, "query" | "category" | "status" | "favorites" | "sort" | "page">> = {
    query: typeof params.q === "string" ? params.q : "",
    category: typeof params.category === "string" ? params.category : "",
    status: params.status === "archived" ? "archived" as const : "active" as const,
    favorites: params.favorites === "1",
    sort: params.sort === "name" || params.sort === "category" ? params.sort : "recent" as const,
    page: typeof params.page === "string" ? Math.max(1, Number(params.page) || 1) : 1,
  };
  const result = await listRecipes(filters);
  return <>
    <PageHeader eyebrow="Formula library" title="Your recipes" description="Search, refine, and reuse every dependable bake formula." actions={<CreateRecipeButton />} />
    <RecipeLibrary {...result} filters={filters} />
  </>;
}
