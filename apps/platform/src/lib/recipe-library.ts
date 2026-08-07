import type { Recipe } from "./planner";

export type RecipeCollectionFilters = {
  query?: string;
  category?: string;
  status?: "active" | "archived";
  favorites?: boolean;
  sort?: "recent" | "name" | "category";
};

export function uniqueRecipeCategories(values: Array<string | null | undefined>) {
  const categories = new Map<string, string>();
  for (const value of values) {
    const category = value?.trim();
    if (category && !categories.has(category.toLocaleLowerCase())) categories.set(category.toLocaleLowerCase(), category);
  }
  return [...categories.values()].sort((a, b) => a.localeCompare(b));
}

export function filterRecipeCollection(recipes: Recipe[], filters: RecipeCollectionFilters = {}) {
  let rows = [...recipes];
  const query = filters.query?.trim().toLocaleLowerCase();
  if (query) rows = rows.filter((recipe) => recipe.name.toLocaleLowerCase().includes(query));
  if (filters.category) rows = rows.filter((recipe) => recipe.category === filters.category);
  rows = filters.status === "archived" ? rows.filter((recipe) => Boolean(recipe.archivedAt)) : rows.filter((recipe) => !recipe.archivedAt);
  if (filters.favorites) rows = rows.filter((recipe) => recipe.isFavorite);
  rows.sort(filters.sort === "category"
    ? (a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name)
    : filters.sort === "name"
      ? (a, b) => a.name.localeCompare(b.name)
      : (a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
  return rows;
}
