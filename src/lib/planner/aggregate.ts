import { supabaseServer } from "@/lib/supabase/server";

export type IngredientLineInput = {
  ingredient_id: string;
  qty: number;
  unit?: string | null;
  multiplier?: number;
};

export type AggregatedIngredientTotal = {
  ingredient_id: string;
  ingredient_name: string;
  canonical_unit: string;
  total_qty: number;
  missing_line_count: number;
};

export type RecipeScalingInput = {
  recipe_yield_qty: number;
  target_output_qty: number;
};

/**
 * Aggregates ingredient lines into canonical ingredient units.
 * Missing conversion mappings are tracked per ingredient in missing_line_count.
 */
export async function aggregateIngredientLines(
  lines: IngredientLineInput[]
): Promise<AggregatedIngredientTotal[]> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.rpc("aggregate_ingredient_lines", {
    p_lines: lines,
  });

  if (error) {
    throw new Error(`Failed to aggregate ingredient lines: ${error.message}`);
  }

  return (data ?? []) as AggregatedIngredientTotal[];
}

export function getScaleFactor({ recipe_yield_qty, target_output_qty }: RecipeScalingInput): number {
  if (!(recipe_yield_qty > 0) || !(target_output_qty > 0)) {
    return 1;
  }
  return target_output_qty / recipe_yield_qty;
}

export function scaleIngredientLines(
  lines: IngredientLineInput[],
  scaling: RecipeScalingInput
): IngredientLineInput[] {
  const factor = getScaleFactor(scaling);
  return lines.map((line) => ({
    ...line,
    qty: line.qty * factor,
  }));
}
