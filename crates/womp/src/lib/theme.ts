import type { AccentColors } from "@/lib/themeStore";
import {
  type Theme,
  webDarkTheme as darkBase,
  webLightTheme as lightBase,
} from "@fluentui/react-components";
import Color from "color";

// @ts-ignore
function ll(color: string, lightness: number): string {
  const lightnessPercentage = lightness * 100;
  return Color(color).lightness(lightnessPercentage).rgb().toString();
}

function l(color: string, lightness: number): string {
  return Color(color).lighten(lightness).rgb().toString();
}

function d(color: string, lightness: number): string {
  return Color(color).darken(lightness).rgb().toString();
}

export function buildTheme(
  mode: "dark" | "light",
  systemColors: AccentColors,
): Theme {
  const dark = mode === "dark";

  return {
    ...(dark ? darkBase : lightBase),
    fontFamilyBase:
      '"Segoe UI", system-ui, "Segoe UI Emoji", "Segoe UI Symbol", "Segoe Fluent Icons", "Settings Fluent Icons", sans-serif',
    colorNeutralForegroundOnBrand: dark
      ? systemColors.background
      : systemColors.foreground,
    colorBrandBackground: dark
      ? systemColors.accent_light_2
      : systemColors.accent_dark_3,
    colorBrandBackgroundHover: dark
      ? d(systemColors.accent_light_2, 0.1)
      : d(systemColors.accent_dark_3, 0.1),
    colorBrandBackgroundPressed: dark
      ? d(systemColors.accent_light_2, 0.3)
      : d(systemColors.accent_dark_3, 0.3),
    colorBrandBackgroundSelected: dark
      ? d(systemColors.accent_light_2, 0.2)
      : d(systemColors.accent_dark_3, 0.2),
    colorBrandForeground1: systemColors.accent_light_2,
    colorCompoundBrandBackground: systemColors.accent_light_2,
    colorCompoundBrandBackgroundHover: d(systemColors.accent_light_2, 0.1),
    colorCompoundBrandBackgroundPressed: d(systemColors.accent_light_2, 0.2),
    colorCompoundBrandStroke: systemColors.accent_light_2,
    colorCompoundBrandStrokeHover: l(systemColors.accent_light_2, 0.1),
    colorCompoundBrandStrokePressed: d(systemColors.accent_light_2, 0.3),
    colorNeutralForeground2BrandHover: systemColors.accent_light_2,
    colorNeutralForeground2BrandPressed: d(systemColors.accent_light_2, 0.3),
    colorNeutralForeground2BrandSelected: d(systemColors.accent_light_2, 0.2),
  };
}
