"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArrowSquareOut, CaretLeft, CaretRight, CheckCircle, FileText, GoogleDriveLogo, MagnifyingGlass, SpinnerGap, Star, X } from "@phosphor-icons/react";
import { formatBakeryDate } from "@/lib/date-format";
import type { Recipe } from "@/lib/planner";

type Props = {
  recipes: Recipe[];
  total: number;
  page: number;
  pageSize: number;
  filters: { query: string; category: string; status: string; favorites: boolean; sort: string };
};

type SelectedRecipe = { id: string; name: string };
type ExportState = "idle" | "checking" | "exporting" | "success" | "partial" | "error";
type StoredSelection = { version: 1; filterKey: string; recipes: SelectedRecipe[] };

const SELECTION_STORAGE_KEY = "hearthworks-recipe-selection-v1";

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

function selectionUrl(filters: Props["filters"]) {
  const params = new URLSearchParams({
    q: filters.query,
    category: filters.category,
    status: filters.status === "archived" ? "archived" : "active",
    favorites: filters.favorites ? "1" : "0",
    sort: filters.sort === "name" || filters.sort === "category" ? filters.sort : "recent",
  });
  return `/api/recipes/export-selection?${params}`;
}

function RecipeRow({ recipe }: { recipe: Recipe }) {
  return <>
    <span className="recipe-name"><span className="row-icon"><FileText weight="duotone" aria-hidden="true" /></span><span><strong>{recipe.name}</strong><small>{recipe.ingredients.length} ingredients</small></span>{recipe.isFavorite ? <Star weight="fill" className="favorite-star" aria-label="Favorite" /> : null}</span>
    <span><em className="category-chip">{recipe.category}</em></span>
    <span>{recipe.yieldPerBatch} {recipe.yieldLabel}</span>
    <span>{recipe.updatedAt ? formatBakeryDate(recipe.updatedAt, { month: "short", day: "numeric" }) : "—"}</span>
    <span className="row-arrow"><CaretRight aria-hidden="true" /></span>
  </>;
}

export function RecipeLibrary({ recipes, total, page, pageSize, filters }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState(filters.query);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState<Map<string, string>>(() => new Map());
  const [selectionLoading, setSelectionLoading] = useState(false);
  const [hydratedFilterKey, setHydratedFilterKey] = useState("");
  const [exportState, setExportState] = useState<ExportState>("idle");
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [failedIds, setFailedIds] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [folderUrl, setFolderUrl] = useState("");
  const cancelRequested = useRef(false);
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const categories = ["Bread", "Bagels", "Sweet Rolls", "Pastry", "Cookies", "Other"];
  const resultKind = filters.favorites ? "favorite" : filters.status === "archived" ? "archived" : "active";
  const filterKey = useMemo(() => JSON.stringify({
    query: filters.query,
    category: filters.category,
    status: filters.status,
    favorites: filters.favorites,
    sort: filters.sort,
  }), [filters.category, filters.favorites, filters.query, filters.sort, filters.status]);

  useEffect(() => {
    if (query === filters.query) return;
    const timer = window.setTimeout(() => router.replace(hrefFor(filters, { query, page: 1 })), 350);
    return () => window.clearTimeout(timer);
  }, [filters, query, router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = JSON.parse(sessionStorage.getItem(SELECTION_STORAGE_KEY) ?? "null") as StoredSelection | null;
        if (stored?.version === 1 && stored.filterKey === filterKey && Array.isArray(stored.recipes) && stored.recipes.length) {
          setSelected(new Map(stored.recipes.map((recipe) => [recipe.id, recipe.name])));
          setSelectionMode(true);
        } else {
          setSelected(new Map());
          setSelectionMode(false);
          sessionStorage.removeItem(SELECTION_STORAGE_KEY);
        }
      } catch {
        setSelected(new Map());
        setSelectionMode(false);
        sessionStorage.removeItem(SELECTION_STORAGE_KEY);
      }
      setHydratedFilterKey(filterKey);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [filterKey]);

  useEffect(() => {
    if (hydratedFilterKey !== filterKey) return;
    if (!selectionMode || selected.size === 0) {
      sessionStorage.removeItem(SELECTION_STORAGE_KEY);
      return;
    }
    const stored: StoredSelection = {
      version: 1,
      filterKey,
      recipes: [...selected].map(([id, name]) => ({ id, name })),
    };
    sessionStorage.setItem(SELECTION_STORAGE_KEY, JSON.stringify(stored));
  }, [filterKey, hydratedFilterKey, selected, selectionMode]);

  function beginSelection() {
    setSelectionMode(true);
    setMessage("");
    setExportState("idle");
  }

  function cancelSelection() {
    cancelRequested.current = true;
    setSelectionMode(false);
    setSelected(new Map());
    setFailedIds([]);
    setFolderUrl("");
    setMessage("");
    setExportState("idle");
    sessionStorage.removeItem(SELECTION_STORAGE_KEY);
  }

  function toggleRecipe(recipe: SelectedRecipe) {
    setSelected((current) => {
      const next = new Map(current);
      if (next.has(recipe.id)) next.delete(recipe.id);
      else next.set(recipe.id, recipe.name);
      return next;
    });
    setExportState("idle");
    setMessage("");
  }

  async function selectAllMatching() {
    setSelectionLoading(true);
    setMessage("");
    try {
      const response = await fetch(selectionUrl(filters));
      const result = await response.json();
      if (!response.ok) {
        setMessage(result.error ?? "Could not select the matching recipes.");
        return;
      }
      setSelected(new Map((result.recipes as SelectedRecipe[]).map((recipe) => [recipe.id, recipe.name])));
    } catch {
      setMessage("Could not select the matching recipes.");
    } finally {
      setSelectionLoading(false);
    }
  }

  function googleConnectUrl() {
    const returnTo = `${window.location.pathname}${window.location.search}`;
    return `/api/google/connect?returnTo=${encodeURIComponent(returnTo)}`;
  }

  async function exportRecipes(recipesToExport: SelectedRecipe[]) {
    if (!recipesToExport.length) return;
    cancelRequested.current = false;
    setExportState("checking");
    setMessage("");
    setFolderUrl("");
    setProgress({ completed: 0, total: recipesToExport.length });
    setFailedIds([]);

    try {
      const statusResponse = await fetch("/api/google/status");
      const status = await statusResponse.json();
      if (!statusResponse.ok || !status.connected) {
        setMessage(status.needsReconnect ? "Reconnect Google Drive to export recipes." : "Connect Google Drive to export recipes.");
        setExportState("error");
        window.location.assign(googleConnectUrl());
        return;
      }
    } catch {
      setMessage("Could not check the Google Drive connection.");
      setExportState("error");
      return;
    }

    setExportState("exporting");
    const failures: string[] = [];
    let completed = 0;
    for (const recipe of recipesToExport) {
      if (cancelRequested.current) break;
      try {
        const response = await fetch("/api/google/recipes/export", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ recipeId: recipe.id }),
        });
        const result = await response.json();
        if (!response.ok) {
          if (result.reconnect) {
            setMessage("Google Drive needs to be reconnected before the export can continue.");
            setExportState("error");
            window.location.assign(googleConnectUrl());
            return;
          }
          failures.push(recipe.id);
        } else if (result.folderUrl) {
          setFolderUrl(result.folderUrl);
        }
      } catch {
        failures.push(recipe.id);
      }
      completed += 1;
      setProgress({ completed, total: recipesToExport.length });
    }

    setFailedIds(failures);
    if (cancelRequested.current) {
      setExportState(failures.length ? "partial" : "idle");
      setMessage(`Stopped after ${completed} of ${recipesToExport.length} recipes.`);
    } else if (failures.length) {
      setExportState("partial");
      setMessage(`${recipesToExport.length - failures.length} recipes exported. ${failures.length} could not be exported.`);
    } else {
      setExportState("success");
      setMessage(`${recipesToExport.length} ${recipesToExport.length === 1 ? "recipe" : "recipes"} exported to Google Drive.`);
    }
  }

  const selectedRecipes = [...selected].map(([id, name]) => ({ id, name }));
  const failedRecipes = selectedRecipes.filter((recipe) => failedIds.includes(recipe.id));

  return <>
    <div className="library-toolbar">
      <label className="search-field"><MagnifyingGlass aria-hidden="true" /><span className="sr-only">Search recipes</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search recipes…" /></label>
      <select value={filters.category} aria-label="Filter by category" onChange={(event) => router.replace(hrefFor(filters, { category: event.target.value, page: 1 }))}><option value="">All categories</option>{categories.map((category) => <option key={category}>{category}</option>)}</select>
      <select value={filters.sort} aria-label="Sort recipes" onChange={(event) => router.replace(hrefFor(filters, { sort: event.target.value, page: 1 }))}><option value="recent">Recently updated</option><option value="name">A–Z</option><option value="category">Category</option></select>
    </div>
    <div className="library-view-bar">
      <div className="library-tabs" role="navigation" aria-label="Recipe views">
        <Link aria-current={filters.status === "active" && !filters.favorites ? "page" : undefined} className={filters.status === "active" && !filters.favorites ? "active" : ""} href={hrefFor(filters, { status: "active", favorites: false, page: 1 })}>Active</Link>
        <Link aria-current={filters.favorites ? "page" : undefined} className={filters.favorites ? "active" : ""} href={hrefFor(filters, { status: "active", favorites: true, page: 1 })}><Star weight="fill" />Favorites</Link>
        <Link aria-current={filters.status === "archived" ? "page" : undefined} className={filters.status === "archived" ? "active" : ""} href={hrefFor(filters, { status: "archived", favorites: false, page: 1 })}><Archive />Archived</Link>
      </div>
      <div className="library-view-actions"><p className="library-result-count" aria-live="polite">{total.toLocaleString()} {resultKind} {total === 1 ? "recipe" : "recipes"}</p>{total > 0 && !selectionMode ? <button className="compact-button recipe-select-button" onClick={beginSelection}>Select recipes</button> : null}</div>
    </div>
    {selectionMode ? <section className="recipe-selection-bar" aria-label="Recipe selection actions">
      <div><strong>{selected.size.toLocaleString()} selected</strong><small>Select recipes to create or update their managed Google Docs.</small></div>
      <div className="recipe-selection-actions">
        <button className="compact-button" onClick={selectAllMatching} disabled={selectionLoading || exportState === "exporting"}>{selectionLoading ? <SpinnerGap className="spin" /> : <CheckCircle />}Select all {total.toLocaleString()}</button>
        <button className="button primary icon-button" onClick={() => exportRecipes(selectedRecipes)} disabled={!selected.size || exportState === "checking" || exportState === "exporting"}>{exportState === "checking" || exportState === "exporting" ? <SpinnerGap className="spin" /> : <GoogleDriveLogo weight="bold" />}Export to Google Drive</button>
        <button className="compact-button" onClick={cancelSelection} disabled={exportState === "exporting"}><X />Cancel</button>
      </div>
      {exportState === "exporting" ? <div className="recipe-export-progress" aria-live="polite"><span><strong>Exporting {progress.completed} of {progress.total}</strong><small>Keep this page open while Hearthworks updates each recipe Doc.</small></span><button className="text-button" onClick={() => { cancelRequested.current = true; setMessage("Stopping after the current recipe…"); }}>Stop after current</button></div> : null}
      {message ? <div className={exportState === "error" || exportState === "partial" ? "recipe-export-message error" : "recipe-export-message"} aria-live="polite"><span>{message}</span>{failedRecipes.length ? <button className="compact-button" onClick={() => exportRecipes(failedRecipes)}>Retry failed</button> : null}{folderUrl ? <a href={folderUrl} target="_blank" rel="noreferrer">Open Hearthworks Recipes <ArrowSquareOut /></a> : null}</div> : null}
    </section> : null}
    {recipes.length ? <div className={selectionMode ? "recipe-table selection-mode" : "recipe-table"} role="list">
      {selectionMode ? <div className="recipe-select-head"><span>Select</span><div className="recipe-table-head"><span>Recipe</span><span>Category</span><span>Yield</span><span>Updated</span><span /></div></div> : <div className="recipe-table-head"><span>Recipe</span><span>Category</span><span>Yield</span><span>Updated</span><span /></div>}
      {recipes.map((recipe) => selectionMode ? <div className="recipe-select-row" key={recipe.id} role="listitem">
        <label className="recipe-select-control"><input type="checkbox" checked={selected.has(recipe.id)} onChange={() => toggleRecipe({ id: recipe.id, name: recipe.name })} /><span className="sr-only">Select {recipe.name}</span></label>
        <Link className="recipe-table-row" href={`/recipes/${recipe.id}`}><RecipeRow recipe={recipe} /></Link>
      </div> : <Link className="recipe-table-row" href={`/recipes/${recipe.id}`} key={recipe.id} role="listitem"><RecipeRow recipe={recipe} /></Link>)}
    </div> : <div className="empty-state"><span className="empty-icon"><MagnifyingGlass /></span><h2>No recipes found</h2><p>Adjust the filters or create a recipe to start your library.</p></div>}
    {pages > 1 && <nav className="pagination" aria-label="Recipe pages"><Link aria-disabled={page === 1} href={hrefFor(filters, { page: Math.max(1, page - 1) })}><CaretLeft />Previous</Link><span>Page {page} of {pages} · {total} recipes</span><Link aria-disabled={page === pages} href={hrefFor(filters, { page: Math.min(pages, page + 1) })}>Next<CaretRight /></Link></nav>}
  </>;
}
