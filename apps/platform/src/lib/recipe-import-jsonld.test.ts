import { describe, expect, it } from "vitest";
import { recipeDraftsFromJsonLd, stripHtmlForRecipeImport } from "./recipe-import-jsonld";

describe("Schema.org recipe imports", () => {
  it("extracts a reviewable recipe without consuming AI", () => {
    const html = `<html><head><script type="application/ld+json">${JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Recipe",
      name: "Market Sourdough",
      recipeCategory: "Bread",
      recipeYield: "2 loaves",
      cookTime: "PT42M",
      recipeIngredient: ["500 g bread flour", "350 g water", "100 g active starter", "10 g salt"],
      recipeInstructions: [{ "@type": "HowToStep", text: "Mix the dough." }, { "@type": "HowToStep", text: "Bake until deeply browned." }],
    })}</script></head><body>Noise</body></html>`;

    const drafts = recipeDraftsFromJsonLd(html, "https://example.com/sourdough");
    expect(drafts).toHaveLength(1);
    expect(drafts[0]).toMatchObject({
      name: "Market Sourdough",
      category: "Bread",
      yieldPerBatch: 2,
      yieldLabel: "loaves",
      cycleMinutes: 42,
      source: { processingMethod: "json_ld", url: "https://example.com/sourdough" },
    });
    expect(drafts[0].ingredients.map((ingredient) => ingredient.role)).toEqual(["flour", "water", "active_starter", "other"]);
    expect(drafts[0].instructions).toContain("Mix the dough.");
  });

  it("detects multiple recipes inside an @graph", () => {
    const html = `<script type="application/ld+json">${JSON.stringify({
      "@graph": [
        { "@type": "Recipe", name: "One", recipeIngredient: ["100 g flour"] },
        { "@type": ["Thing", "Recipe"], name: "Two", recipeIngredient: ["200 g flour"] },
      ],
    })}</script>`;
    expect(recipeDraftsFromJsonLd(html, "https://example.com/recipes").map((draft) => draft.name)).toEqual(["One", "Two"]);
  });

  it("strips scripts and markup before an AI fallback", () => {
    const text = stripHtmlForRecipeImport("<style>.hidden{}</style><script>secret()</script><h1>Recipe</h1><p>500 g flour &amp; water</p>");
    expect(text).toBe("Recipe 500 g flour & water");
    expect(text).not.toContain("secret");
  });
});
