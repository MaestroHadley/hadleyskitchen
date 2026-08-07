import { describe, expect, it } from "vitest";
import { bakeryThemes, DEFAULT_THEME_ID, isThemeId, resolveThemeId, THEME_IDS } from "./themes";

describe("bakery themes", () => {
  it("defines complete metadata for every supported theme", () => {
    expect(bakeryThemes.map((theme) => theme.id)).toEqual(THEME_IDS);
    for (const theme of bakeryThemes) {
      expect(theme.name.length).toBeGreaterThan(0);
      expect(theme.description.length).toBeGreaterThan(0);
    }
  });

  it("accepts only supported theme ids", () => {
    expect(isThemeId("garden")).toBe(true);
    expect(isThemeId("midnight")).toBe(false);
    expect(isThemeId(null)).toBe(false);
  });

  it("falls back safely to Studio", () => {
    expect(resolveThemeId(undefined)).toBe(DEFAULT_THEME_ID);
    expect(resolveThemeId("midnight")).toBe(DEFAULT_THEME_ID);
  });

  it("keeps every theme's critical text combinations at WCAG AA contrast", () => {
    const pairs = {
      studio: [
        ["#fffdf8", "#312538"],
        ["#9da195", "#312538"],
        ["#312538", "#f8f2e9"],
        ["#665e69", "#fffdf8"],
        ["#f8f2e9", "#392c41"],
        ["#f8f2e9", "#312538"],
        ["#392c41", "#ebe5ed"],
        ["#fffdf8", "#596054"],
        ["#e4e7de", "#596054"],
        ["#56614f", "#e2e7de"],
        ["#963f49", "#f7e7e8"],
      ],
      garden: [
        ["#fffefb", "#3f5037"],
        ["#dce3d4", "#3f5037"],
        ["#25261f", "#faf8f1"],
        ["#66685d", "#fffefb"],
        ["#ffffff", "#657b4c"],
        ["#ffffff", "#53663e"],
        ["#53663e", "#e5eadb"],
        ["#ffffff", "#9a6b20"],
        ["#557052", "#e5ecdf"],
        ["#9f4545", "#f8e9e7"],
      ],
      confetti: [
        ["#fffdf8", "#284f72"],
        ["#d7e3ec", "#284f72"],
        ["#24272b", "#fbf8f1"],
        ["#626a72", "#fffdf8"],
        ["#ffffff", "#356fa5"],
        ["#ffffff", "#2c5e8c"],
        ["#2c5e8c", "#e0edf6"],
        ["#ffffff", "#984929"],
        ["#496b4a", "#e1ebdf"],
        ["#a34040", "#f8e7e5"],
      ],
    } as const;

    for (const themePairs of Object.values(pairs)) {
      for (const [foreground, background] of themePairs) {
        expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});

function contrastRatio(foreground: string, background: string) {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

function relativeLuminance(hex: string) {
  const channels = hex.match(/[\da-f]{2}/gi)?.map((channel) => Number.parseInt(channel, 16) / 255) ?? [];
  const [red = 0, green = 0, blue = 0] = channels.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}
