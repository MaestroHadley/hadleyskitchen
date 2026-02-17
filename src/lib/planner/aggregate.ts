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
