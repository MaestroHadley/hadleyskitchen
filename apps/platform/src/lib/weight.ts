const GRAMS_PER_OUNCE = 28.349523125;
const OUNCES_PER_POUND = 16;

export function formatPoundsOunces(grams: number) {
  if (!Number.isFinite(grams) || grams <= 0) return "0 oz";

  const totalOunces = grams / GRAMS_PER_OUNCE;
  const pounds = Math.floor(totalOunces / OUNCES_PER_POUND);
  const ounces = totalOunces - pounds * OUNCES_PER_POUND;
  const roundedOunces = Math.round(ounces * 10) / 10;

  if (roundedOunces >= OUNCES_PER_POUND) return `${pounds + 1} lb`;
  if (pounds === 0) return `${roundedOunces.toLocaleString("en-US", { maximumFractionDigits: 1 })} oz`;
  if (roundedOunces === 0) return `${pounds} lb`;
  return `${pounds} lb ${roundedOunces.toLocaleString("en-US", { maximumFractionDigits: 1 })} oz`;
}

export function formatShoppingWeight(grams: number, unit: "grams" | "imperial") {
  return unit === "grams"
    ? `${Math.round(grams).toLocaleString("en-US")} g`
    : formatPoundsOunces(grams);
}
