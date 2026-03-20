/** Theme type system for Takomi v6 shared renderer */

export type ThemeMode = 'dark' | 'light';

export interface ThemeTokens {
  readonly mode: ThemeMode;

  /* ── Structural surfaces ── */
  readonly bgApp: string;
  readonly bgStrip: string;
  readonly bgSidebar: string;
  readonly bgMain: string;
  readonly bgElevated: string;
  readonly bgInput: string;

  /* ── Borders & dividers ── */
  readonly borderOuter: string;
  readonly borderInner: string;
  readonly borderFocus: string;

  /* ── Typography ── */
  readonly textPrimary: string;
  readonly textSecondary: string;
  readonly textMuted: string;
  readonly textInverse: string;

  /* ── Brand accent (Takomi yellow) ── */
  readonly accent: string;
  readonly accentSoft: string;
  readonly accentGlow: string;

  /* ── Semantic status ── */
  readonly success: string;
  readonly successSoft: string;
  readonly danger: string;
  readonly dangerSoft: string;
  readonly warning: string;
  readonly warningSoft: string;

  /* ── Interactive states ── */
  readonly hover: string;
  readonly active: string;
  readonly selected: string;

  /* ── Glass / composer ── */
  readonly glassBg: string;
  readonly glassBlur: string;
  readonly glassBorder: string;

  /* ── Shadows ── */
  readonly shadowPremium: string;
  readonly shadowSubtle: string;

  /* ── Misc ── */
  readonly scrollThumb: string;
  readonly scrollThumbHover: string;
  readonly codeBlockBg: string;
}
