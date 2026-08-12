"use client";

import { useState } from "react";
import { formatShoppingWeight } from "@/lib/weight";

type ShoppingRow = {
  name: string;
  exact: number;
  buffered: number;
  packages: number | null;
};

export function ShoppingList({ rows }: { rows: ShoppingRow[] }) {
  const [unit, setUnit] = useState<"grams" | "imperial">("grams");

  return <article className="panel report-section shopping-list-panel">
    <div className="shopping-list-heading">
      <div><p className="eyebrow">Ingredient control</p><h2>Shopping list</h2></div>
      <div className="unit-toggle" role="group" aria-label="Shopping list units">
        <button type="button" aria-pressed={unit === "grams"} onClick={() => setUnit("grams")}>Grams</button>
        <button type="button" aria-pressed={unit === "imperial"} onClick={() => setUnit("imperial")}>lb + oz</button>
      </div>
    </div>
    {rows.map((row) => <label className="shopping-row" key={row.name}>
      <input type="checkbox" />
      <span><strong>{row.name}</strong><small>{formatShoppingWeight(row.exact, unit)} exact</small></span>
      <b>{formatShoppingWeight(row.buffered, unit)}</b>
      {row.packages && <em>{row.packages} packages</em>}
    </label>)}
  </article>;
}
