export const uiTokens = {
  background: '#0b1221',
  backgroundSoft: '#111a31',
  surface: '#16213d',
  surfaceElevated: '#1b2847',
  border: 'rgba(148, 163, 184, 0.24)',
  text: '#e5eefc',
  textMuted: '#94a3b8',
  accent: '#7dd3fc',
  accentStrong: '#38bdf8'
} as const;

export type UITokenName = keyof typeof uiTokens;
