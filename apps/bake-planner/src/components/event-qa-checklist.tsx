"use client";

import { useState } from "react";
import { Check, SpinnerGap, WarningCircle } from "@phosphor-icons/react";
import { saveEventQaChecks } from "@/app/actions";
import type { EventQaChecks, QaCheckKey } from "@/lib/planner";

const checks: Array<{ key: QaCheckKey; label: string }> = [
  { key: "quantities", label: "Quantities verified" },
  { key: "starter", label: "Starter scheduled" },
  { key: "shopping", label: "Shopping completed" },
  { key: "oven", label: "Oven sequence confirmed" },
  { key: "finalCount", label: "Final count reconciled" },
];

export function EventQaChecklist({ eventId, initialChecks }: { eventId: string; initialChecks: EventQaChecks }) {
  const [values, setValues] = useState(initialChecks);
  const [state, setState] = useState<"saved" | "saving" | "error">("saved");

  async function update(key: QaCheckKey, checked: boolean) {
    const next = { ...values, [key]: checked };
    setValues(next);
    setState("saving");
    const result = await saveEventQaChecks(eventId, next);
    setState(result.ok ? "saved" : "error");
  }

  return <article className="panel qa-card">
    <p className="eyebrow">Final QA</p>
    <div className="qa-heading"><h2>Ready for production</h2><small className={state}>{state === "saving" ? <><SpinnerGap className="spin" /> Saving</> : state === "error" ? <><WarningCircle /> Couldn’t save</> : "Saved"}</small></div>
    {checks.map(({ key, label }) => <label key={key}>
      <input type="checkbox" checked={values[key]} onChange={(event) => update(key, event.target.checked)} />
      <span>{label}</span>
      {values[key] && <Check aria-hidden="true" />}
    </label>)}
  </article>;
}
