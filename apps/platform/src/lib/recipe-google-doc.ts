import type { Recipe } from "./planner";

export type RecipeGoogleDocSection = {
  heading: string;
  body?: string;
  rows?: string[][];
};

export type RecipeGoogleDocModel = {
  title: string;
  subtitle: string;
  summary: Array<{ label: string; value: string }>;
  sections: RecipeGoogleDocSection[];
  footer: string;
};

function displayRole(role: string) {
  return role.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function buildRecipeGoogleDocModel(recipe: Recipe, exportedAt: string): RecipeGoogleDocModel {
  const exportedDate = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(exportedAt));

  return {
    title: recipe.name,
    subtitle: `Version ${recipe.version ?? 1} · Exported ${exportedDate}`,
    summary: [
      { label: "CATEGORY", value: recipe.category },
      { label: "BATCH YIELD", value: `${recipe.yieldPerBatch} ${recipe.yieldLabel}` },
      { label: "OVEN CAPACITY", value: `${recipe.ovenCapacity} per cycle` },
      { label: "CYCLE TIME", value: `${recipe.cycleMinutes} minutes` },
    ],
    sections: [
      {
        heading: "Ingredients",
        rows: [
          ["Ingredient", "Grams", "Role"],
          ...recipe.ingredients.map((ingredient) => [
            ingredient.name,
            `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(ingredient.grams)} g`,
            displayRole(ingredient.role),
          ]),
        ],
      },
      {
        heading: "Instructions",
        body: recipe.instructions?.trim() || "No instructions have been added yet.",
      },
      {
        heading: "Recipe notes",
        body: recipe.notes?.trim() || "No recipe notes have been added yet.",
      },
    ],
    footer: "HEARTHWORKS · THE OPERATING SYSTEM FOR INDEPENDENT BAKERS\nExported as a recipe snapshot. Verify the formula before production.",
  };
}
