export const BAKERY_TIME_ZONE = "America/Los_Angeles";

export function formatBakeryDate(value: string | Date, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-US", {
    ...options,
    timeZone: BAKERY_TIME_ZONE,
  }).format(typeof value === "string" ? new Date(value) : value);
}
