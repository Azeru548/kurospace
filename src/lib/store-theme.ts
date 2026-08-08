import type { CSSProperties } from "react";
import type { VendorBranding, StorefrontTheme } from "@/types";
import { DEFAULT_BRANDING } from "@/types";

/**
 * Per-theme visual tokens exposed as CSS custom properties.
 * The storefront shell sets these on the wrapper so every store page
 * (storefront, product detail, cart, order confirmations) picks them up.
 */
export interface ThemeSpec {
  className: string;
  radius: string; // --brand-radius
  cardBorder: string; // --brand-card-border
  cardShadow: string; // --brand-card-shadow
  headingTransform: string; // --brand-heading-transform
  headingWeight: string; // --brand-heading-weight
  headingSpacing: string; // --brand-heading-spacing
  btnRadius: string; // --brand-btn-radius
  sectionBg: string; // --brand-section-bg
  muted: string; // --brand-muted
}

const THEMES: Record<StorefrontTheme, ThemeSpec> = {
  minimal: {
    className: "store-theme-minimal",
    radius: "0.75rem",
    cardBorder: "1px solid rgba(15, 23, 42, 0.08)",
    cardShadow: "0 1px 2px rgba(0, 0, 0, 0.06)",
    headingTransform: "none",
    headingWeight: "700",
    headingSpacing: "normal",
    btnRadius: "0.5rem",
    sectionBg: "rgba(15, 23, 42, 0.02)",
    muted: "rgba(15, 23, 42, 0.6)",
  },
  bold: {
    className: "store-theme-bold",
    radius: "0.25rem",
    cardBorder: "2px solid rgba(15, 23, 42, 0.1)",
    cardShadow: "0 8px 24px rgba(0, 0, 0, 0.14)",
    headingTransform: "uppercase",
    headingWeight: "800",
    headingSpacing: "0.03em",
    btnRadius: "0.25rem",
    sectionBg: "rgba(15, 23, 42, 0.03)",
    muted: "rgba(15, 23, 42, 0.55)",
  },
  elegant: {
    className: "store-theme-elegant",
    radius: "0.125rem",
    cardBorder: "1px solid rgba(15, 23, 42, 0.16)",
    cardShadow: "none",
    headingTransform: "none",
    headingWeight: "600",
    headingSpacing: "0.04em",
    btnRadius: "0",
    sectionBg: "#fafaf9",
    muted: "rgba(15, 23, 42, 0.55)",
  },
  marketplace: {
    className: "store-theme-marketplace",
    radius: "0.5rem",
    cardBorder: "1px solid rgba(15, 23, 42, 0.08)",
    cardShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
    headingTransform: "none",
    headingWeight: "700",
    headingSpacing: "normal",
    btnRadius: "9999px",
    sectionBg: "rgba(15, 23, 42, 0.03)",
    muted: "rgba(15, 23, 42, 0.55)",
  },
};

export function themeClassName(branding: VendorBranding): string {
  return THEMES[branding.theme]?.className ?? THEMES.minimal.className;
}

/** Build the CSS custom-property object + base colors for a store wrapper. */
export function brandVars(branding: VendorBranding): CSSProperties {
  const b = { ...DEFAULT_BRANDING, ...branding };
  const t = THEMES[b.theme] ?? THEMES.minimal;
  return {
    "--brand-primary": b.primaryColor,
    "--brand-secondary": b.secondaryColor,
    "--brand-accent": b.accentColor,
    "--brand-bg": b.backgroundColor,
    "--brand-text": b.textColor,
    "--brand-radius": t.radius,
    "--brand-card-border": t.cardBorder,
    "--brand-card-shadow": t.cardShadow,
    "--brand-heading-transform": t.headingTransform,
    "--brand-heading-weight": t.headingWeight,
    "--brand-heading-spacing": t.headingSpacing,
    "--brand-btn-radius": t.btnRadius,
    "--brand-section-bg": t.sectionBg,
    "--brand-muted": t.muted,
    "--brand-heading-font": b.headingFont || b.fontFamily,
    "--brand-body-font": b.fontFamily,
    background: b.backgroundColor,
    color: b.textColor,
    fontFamily: b.fontFamily,
  } as CSSProperties;
}
