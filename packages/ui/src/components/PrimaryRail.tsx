import type { ReactElement } from 'react';
import type { ThemeTokens } from '../theme';

export interface PrimaryRailProps {
  readonly theme: ThemeTokens;
  readonly activeNavIndex?: number;
}

/** Far-left navigation strip — global product movement */
export function PrimaryRail({
  theme,
  activeNavIndex = 0,
}: PrimaryRailProps): ReactElement {
  const navItems = [
    { label: 'Sessions', icon: 'terminal' },
    { label: 'Worktrees', icon: 'git-branch' },
    { label: 'Monitor', icon: 'bar-chart' },
  ];

  const bottomItems = [
    { label: 'Settings', icon: 'settings' },
  ];

  return (
    <nav
      data-component="primary-rail"
      style={{
        width: '56px',
        minWidth: '56px',
        background: theme.bgStrip,
        borderRight: `1px solid ${theme.borderOuter}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '16px 0',
        justifyContent: 'space-between',
        zIndex: 50,
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', width: '100%' }}>
        {/* Logo */}
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '12px',
            background: theme.accent,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: theme.textInverse,
            fontWeight: 800,
            fontSize: '16px',
            boxShadow: `0 0 15px ${theme.accentGlow}`,
          }}
        >
          T
        </div>

        {/* Nav icons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px', width: '100%', alignItems: 'center' }}>
          {navItems.map((item, i) => (
            <button
              key={item.label}
              title={item.label}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: i === activeNavIndex ? theme.selected : 'transparent',
                color: i === activeNavIndex ? theme.accent : theme.textMuted,
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              {item.icon.charAt(0).toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', width: '100%' }}>
        {bottomItems.map((item) => (
          <button
            key={item.label}
            title={item.label}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              cursor: 'pointer',
              background: 'transparent',
              color: theme.textMuted,
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            {item.icon.charAt(0).toUpperCase()}
          </button>
        ))}
        {/* Avatar placeholder */}
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: theme.bgElevated,
            border: `1px solid ${theme.borderInner}`,
          }}
        />
      </div>
    </nav>
  );
}
