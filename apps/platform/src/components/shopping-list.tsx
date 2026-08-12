"use client";

import { useState } from "react";
import { SpinnerGap, WarningCircle } from "@phosphor-icons/react";
import { saveEventShoppingChecks } from "@/app/actions";
import { formatShoppingWeight } from "@/lib/weight";

type ShoppingRow = {
  name: string;
  exact: number;
  buffered: number;
  packages: number | null;
};

export function ShoppingList({ eventId, rows, initialChecked }: { eventId: string; rows: ShoppingRow[]; initialChecked: string[] }) {
  const [unit, setUnit] = useState<"grams" | "imperial">("grams");
  const [checkedItems, setCheckedItems] = useState(initialChecked);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "error">("saved");

  async function updateChecked(name: string, checked: boolean) {
    const previous = checkedItems;
    const next = checked ? [...new Set([...checkedItems, name])] : checkedItems.filter((item) => item !== name);
    setCheckedItems(next);
    setSaveState("saving");
    const result = await saveEventShoppingChecks(eventId, next);
    if (!result.ok) setCheckedItems(previous);
    setSaveState(result.ok ? "saved" : "error");
  }

  return <article className="panel report-section shopping-list-panel">
    <div className="shopping-list-heading">
      <div><p className="eyebrow">Ingredient control</p><h2>Shopping list</h2></div>
      <div className="shopping-list-tools">
        <small className={`shopping-save-state ${saveState}`} aria-live="polite">{saveState === "saving" ? <><SpinnerGap className="spin" /> Saving</> : saveState === "error" ? <><WarningCircle /> Couldn’t save</> : "Saved"}</small>
        <div className="unit-toggle" role="group" aria-label="Shopping list units">
          <button type="button" aria-pressed={unit === "grams"} onClick={() => setUnit("grams")}>Grams</button>
          <button type="button" aria-pressed={unit === "imperial"} onClick={() => setUnit("imperial")}>lb + oz</button>
        </div>
      </div>
    </div>
    {rows.map((row) => <label className="shopping-row" key={row.name}>
      <input type="checkbox" checked={checkedItems.includes(row.name)} disabled={saveState === "saving"} onChange={(event) => updateChecked(row.name, event.target.checked)} />
      <span><strong>{row.name}</strong><small>{formatShoppingWeight(row.exact, unit)} exact</small></span>
      <b>{formatShoppingWeight(row.buffered, unit)}</b>
      {row.packages && <em>{row.packages} packages</em>}
    </label>)}
  </article>;
}
