import type { ReactElement } from 'react';
import type { SessionDescriptor } from '@takomi/contracts';
import type { ThemeTokens } from '../theme';

export interface SessionsSidebarProps {
  readonly theme: ThemeTokens;
  readonly sessions: readonly SessionDescriptor[];
  readonly activeSessionId: string | null;
  readonly workspaceName: string;
  readonly collapsed?: boolean;
}

/** Left sidebar: workspace selector, session list, new session button */
export function SessionsSidebar({
  theme,
  sessions,
  activeSessionId,
  workspaceName,
  collapsed = false,
}: SessionsSidebarProps): ReactElement {
  if (collapsed) {
    return <div data-component="sessions-sidebar" style={{ width: 0, overflow: 'hidden' }} />;
  }

  return (
    <aside
      data-component="sessions-sidebar"
      style={{
        width: '280px',
        minWidth: '280px',
        background: theme.bgSidebar,
        borderRight: `1px solid ${theme.borderInner}`,
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        zIndex: 40,
      }}
    >
      {/* Workspace selector header */}
      <div style={{ padding: '20px 20px 12px', borderBottom: `1px solid ${theme.borderInner}` }}>
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            background: theme.bgInput,
            border: `1px solid ${theme.borderInner}`,
            borderRadius: '12px',
            padding: '8px 12px',
            cursor: 'pointer',
            color: theme.textPrimary,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                background: theme.bgElevated,
                color: theme.accent,
                border: `1px solid ${theme.borderInner}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              W
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', overflow: 'hidden' }}>
              <span style={{
                fontSize: '10px',
                color: theme.textMuted,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontWeight: 700,
                lineHeight: 1,
                marginBottom: '2px',
              }}>
                Workspace
              </span>
              <span style={{
                fontSize: '12px',
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 500,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                width: '100%',
                textAlign: 'left',
              }}>
                {workspaceName}
              </span>
            </div>
          </div>
          <span style={{ color: theme.textMuted, fontSize: '11px', flexShrink: 0 }}>⇅</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, letterSpacing: '-0.01em', color: theme.textPrimary, margin: 0 }}>
            Sessions
          </h2>
          <button
            title="New Session"
            style={{
              width: '28px', height: '28px', borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: 'none', background: 'transparent', color: theme.textMuted,
              cursor: 'pointer', fontSize: '16px',
            }}
          >
            +
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '12px 20px', borderBottom: `1px solid ${theme.borderInner}` }}>
        <div
          style={{
            background: theme.bgInput,
            border: `1px solid ${theme.borderInner}`,
            borderRadius: '12px',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span style={{ color: theme.textMuted, fontSize: '13px' }}>⌕</span>
          <span style={{ color: theme.textMuted, fontSize: '13px' }}>Search sessions…</span>
        </div>
      </div>

      {/* Session list */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
        }}
      >
        {sessions.map((session) => {
          const isActive = session.id === activeSessionId;
          return (
            <div
              key={session.id}
              style={{
                padding: '8px 12px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                background: isActive ? theme.selected : 'transparent',
                border: isActive ? `1px solid ${theme.borderInner}` : '1px solid transparent',
              }}
            >
              <span style={{ color: theme.accent, fontSize: '14px' }}>◆</span>
              <span
                style={{
                  fontWeight: 500,
                  color: isActive ? theme.accent : theme.textSecondary,
                  fontSize: '13px',
                }}
              >
                {session.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* New Session CTA */}
      <div style={{ padding: '16px 20px', borderTop: `1px solid ${theme.borderInner}` }}>
        <button
          style={{
            width: '100%',
            height: '44px',
            background: theme.accent,
            color: theme.textInverse,
            fontWeight: 600,
            letterSpacing: '0.02em',
            borderRadius: '12px',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '13px',
            boxShadow: `0 0 15px ${theme.accentSoft}`,
          }}
        >
          + New Session
        </button>
      </div>
    </aside>
  );
}
