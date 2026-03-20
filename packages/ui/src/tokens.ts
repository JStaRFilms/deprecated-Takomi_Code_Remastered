import type { ThemeMode, ThemeTokens } from './theme';

/* ────────────────────────────────────────────────
 *  Takomi v6 Design Tokens
 *  Dark theme: dark graphite foundation per v6 spec
 *  Light theme: warm white premium surfaces
 * ──────────────────────────────────────────────── */

const dark: ThemeTokens = {
  mode: 'dark',

  bgApp:       '#0C0C0D',
  bgStrip:     '#09090A',
  bgSidebar:   '#111112',
  bgMain:      '#151516',
  bgElevated:  '#1E1E1F',
  bgInput:     '#1C1C1E',

  borderOuter: 'rgba(255, 255, 255, 0.08)',
  borderInner: 'rgba(255, 255, 255, 0.05)',
  borderFocus: 'rgba(250, 204, 21, 0.4)',

  textPrimary:   '#E5E5E5',
  textSecondary: '#C9CDD5',
  textMuted:     '#94A3B8',
  textInverse:   '#09090A',

  accent:      '#FACC15',
  accentSoft:  'rgba(250, 204, 21, 0.15)',
  accentGlow:  'rgba(250, 204, 21, 0.3)',

  success:     '#10B981',
  successSoft: 'rgba(16, 185, 129, 0.12)',
  danger:      '#EF4444',
  dangerSoft:  'rgba(239, 68, 68, 0.12)',
  warning:     '#F59E0B',
  warningSoft: 'rgba(245, 158, 11, 0.12)',

  hover:    'rgba(255, 255, 255, 0.05)',
  active:   'rgba(255, 255, 255, 0.08)',
  selected: 'rgba(250, 204, 21, 0.1)',

  glassBg:     'rgba(28, 28, 30, 0.95)',
  glassBlur:   '20px',
  glassBorder: 'rgba(255, 255, 255, 0.05)',

  shadowPremium: '0 20px 50px -12px rgba(0, 0, 0, 0.8)',
  shadowSubtle:  '0 2px 8px rgba(0, 0, 0, 0.3)',

  scrollThumb:      '#2D2D2E',
  scrollThumbHover: '#3D3D3E',
  codeBlockBg:      '#09090A',
} as const;

const light: ThemeTokens = {
  mode: 'light',

  bgApp:       '#F5F5F7',
  bgStrip:     '#ECECED',
  bgSidebar:   '#FAFAFA',
  bgMain:      '#FFFFFF',
  bgElevated:  '#F0F0F2',
  bgInput:     '#ECECEE',

  borderOuter: 'rgba(0, 0, 0, 0.10)',
  borderInner: 'rgba(0, 0, 0, 0.06)',
  borderFocus: 'rgba(202, 160, 0, 0.5)',

  textPrimary:   '#1A1A1B',
  textSecondary: '#3A3A3C',
  textMuted:     '#6B7280',
  textInverse:   '#FFFFFF',

  accent:      '#CA9F00',
  accentSoft:  'rgba(202, 159, 0, 0.12)',
  accentGlow:  'rgba(202, 159, 0, 0.25)',

  success:     '#059669',
  successSoft: 'rgba(5, 150, 105, 0.10)',
  danger:      '#DC2626',
  dangerSoft:  'rgba(220, 38, 38, 0.10)',
  warning:     '#D97706',
  warningSoft: 'rgba(217, 119, 6, 0.10)',

  hover:    'rgba(0, 0, 0, 0.04)',
  active:   'rgba(0, 0, 0, 0.07)',
  selected: 'rgba(202, 159, 0, 0.08)',

  glassBg:     'rgba(255, 255, 255, 0.92)',
  glassBlur:   '20px',
  glassBorder: 'rgba(0, 0, 0, 0.06)',

  shadowPremium: '0 20px 50px -12px rgba(0, 0, 0, 0.15)',
  shadowSubtle:  '0 2px 8px rgba(0, 0, 0, 0.06)',

  scrollThumb:      '#D1D5DB',
  scrollThumbHover: '#9CA3AF',
  codeBlockBg:      '#F3F4F6',
} as const;

const themes: Record<ThemeMode, ThemeTokens> = { dark, light } as const;

export function getTheme(mode: ThemeMode): ThemeTokens {
  return themes[mode];
}

/** Default dark theme for backward compat */
export const uiTokens = dark;

export type { ThemeTokens, ThemeMode };
