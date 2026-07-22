"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, BookOpen, CaretLeft, CaretRight, MagnifyingGlass, Star } from "@phosphor-icons/react/dist/ssr";
import type { Recipe } from "@/lib/planner";

type Props = {
  recipes: Recipe[];
  total: number;
  page: number;
  pageSize: number;
  filters: { query: string; category: string; status: string; favorites: boolean; sort: string };
};

const hrefFor = (filters: Props["filters"], changes: Record<string, string | number | boolean>) => {
  const params = new URLSearchParams();
  const merged = { ...filters, ...changes };
  if (merged.query) params.set("q", String(merged.query));
  if (merged.category) params.set("category", String(merged.category));
  if (merged.status && merged.status !== "active") params.set("status", String(merged.status));
  if (merged.favorites) params.set("favorites", "1");
  if (merged.sort && merged.sort !== "recent") params.set("sort", String(merged.sort));
  if (Number(changes.page ?? 1) > 1) params.set("page", String(changes.page));
  return `/recipes${params.size ? `?${params}` : ""}`;
};

export function RecipeLibrary({ recipes, total, page, pageSize, filters }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState(filters.query);
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const categories = ["Bread", "Bagels", "Sweet Rolls", "Pastry", "Cookies", "Other"];

  useEffect(() => {
    if (query === filters.query) return;
    const timer = window.setTimeout(() => router.replace(hrefFor(filters, { query, page: 1 })), 350);
    return () => window.clearTimeout(timer);
  }, [filters, query, router]);

  return <>
    <div className="library-toolbar">
      <label className="search-field"><MagnifyingGlass aria-hidden="true" /><span className="sr-only">Search recipes</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search recipes…" /></label>
      <select value={filters.category} aria-label="Filter by category" onChange={(event) => router.replace(hrefFor(filters, { category: event.target.value, page: 1 }))}><option value="">All categories</option>{categories.map((category) => <option key={category}>{category}</option>)}</select>
      <select value={filters.sort} aria-label="Sort recipes" onChange={(event) => router.replace(hrefFor(filters, { sort: event.target.value, page: 1 }))}><option value="recent">Recently updated</option><option value="name">A–Z</option><option value="category">Category</option></select>
    </div>
    <div className="library-tabs" role="navigation" aria-label="Recipe views">
      <Link className={filters.status === "active" && !filters.favorites ? "active" : ""} href={hrefFor(filters, { status: "active", favorites: false, page: 1 })}>Active <span>{filters.status === "active" ? total : ""}</span></Link>
      <Link className={filters.favorites ? "active" : ""} href={hrefFor(filters, { status: "active", favorites: true, page: 1 })}><Star weight="fill" />Favorites</Link>
      <Link className={filters.status === "archived" ? "active" : ""} href={hrefFor(filters, { status: "archived", favorites: false, page: 1 })}><Archive />Archived</Link>
    </div>
    {recipes.length ? <div className="recipe-table" role="list">
      <div className="recipe-table-head"><span>Recipe</span><span>Category</span><span>Yield</span><span>Updated</span><span /></div>
      {recipes.map((recipe) => <Link className="recipe-table-row" href={`/recipes/${recipe.id}`} key={recipe.id} role="listitem">
        <span className="recipe-name"><span className="row-icon"><BookOpen aria-hidden="true" /></span><span><strong>{recipe.name}</strong><small>{recipe.ingredients.length} ingredients</small></span>{recipe.isFavorite && <Star weight="fill" className="favorite-star" aria-label="Favorite" />}</span>
        <span><em className="category-chip">{recipe.category}</em></span>
        <span>{recipe.yieldPerBatch} {recipe.yieldLabel}</span>
        <span>{recipe.updatedAt ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(recipe.updatedAt)) : "—"}</span>
        <span className="row-arrow"><CaretRight aria-hidden="true" /></span>
      </Link>)}
    </div> : <div className="empty-state"><span className="empty-icon"><MagnifyingGlass /></span><h2>No recipes found</h2><p>Adjust the filters or create a recipe to start your library.</p></div>}
    {pages > 1 && <nav className="pagination" aria-label="Recipe pages"><Link aria-disabled={page === 1} href={hrefFor(filters, { page: Math.max(1, page - 1) })}><CaretLeft />Previous</Link><span>Page {page} of {pages} · {total} recipes</span><Link aria-disabled={page === pages} href={hrefFor(filters, { page: Math.min(pages, page + 1) })}>Next<CaretRight /></Link></nav>}
  </>;
}
