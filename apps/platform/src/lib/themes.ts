export const THEME_IDS = ["studio", "garden", "confetti"] as const;

export type ThemeId = (typeof THEME_IDS)[number];

export type BakeryTheme = {
  id: ThemeId;
  name: string;
  description: string;
  decorativeAccents: "none" | "botanical" | "confetti";
};

export const DEFAULT_THEME_ID: ThemeId = "studio";

export const bakeryThemes: BakeryTheme[] = [
  {
    id: "studio",
    name: "Studio",
    description: "Hearthworks plum, sage, and porcelain.",
    decorativeAccents: "none",
  },
  {
    id: "garden",
    name: "Garden",
    description: "Organic, calm, and softly expressive.",
    decorativeAccents: "botanical",
  },
  {
    id: "confetti",
    name: "Confetti",
    description: "Bright, friendly, and lightly playful.",
    decorativeAccents: "confetti",
  },
];

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === "string" && THEME_IDS.includes(value as ThemeId);
}

export function resolveThemeId(value: unknown): ThemeId {
  return isThemeId(value) ? value : DEFAULT_THEME_ID;
}
