"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, SpinnerGap } from "@phosphor-icons/react";
import { createRecipe } from "@/app/actions";

export function CreateRecipeButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function create() {
    setPending(true);
    setError("");
    const result = await createRecipe();
    if (!result.ok) {
      setPending(false);
      setError(result.error);
      return;
    }
    if (result.id) router.push(`/recipes/${result.id}`);
  }
  return <div className="action-stack"><button className="button primary" onClick={create} disabled={pending}>{pending ? <SpinnerGap className="spin" /> : <Plus weight="bold" />}New recipe</button>{error && <small className="action-error">{error}</small>}</div>;
}
