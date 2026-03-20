import type { ReactElement } from 'react';
import type { ThemeTokens } from '../theme';
import type { StatusVariant } from './StatusPill';
import { StatusPill } from './StatusPill';

export interface InspectorProps {
  readonly theme: ThemeTokens;
  readonly sessionName: string;
  readonly runStatus: StatusVariant;
  readonly runDescription: string;
  readonly collapsed?: boolean;
}

/** Right inspector sidebar — session details, run state, and contextual info */
export function Inspector({
  theme,
  sessionName,
  runStatus,
  runDescription,
  collapsed = false,
}: InspectorProps): ReactElement {
  if (collapsed) {
    return <div data-component="inspector" style={{ width: 0, overflow: 'hidden' }} />;
  }

  return (
    <aside
      data-component="inspector"
      style={{
        width: '320px',
        minWidth: '320px',
        background: theme.bgSidebar,
        borderLeft: `1px solid ${theme.borderInner}`,
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        zIndex: 40,
      }}
    >
      {/* Header */}
      <div style={{ padding: '20px 24px', borderBottom: `1px solid ${theme.borderInner}` }}>
        <h2 style={{
          fontSize: '18px',
          fontWeight: 600,
          letterSpacing: '-0.01em',
          color: theme.textPrimary,
          margin: 0,
        }}>
          Session Details
        </h2>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        {/* Current run status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{
            fontSize: '10px', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.12em',
            color: theme.textMuted, marginBottom: '4px',
          }}>
            Current Run
          </div>
          <div style={{ fontSize: '15px', fontWeight: 500, color: theme.textPrimary }}>
            {sessionName}
          </div>
          <StatusPill theme={theme} variant={runStatus} />
          <div style={{ fontSize: '12px', color: theme.textMuted, marginTop: '4px' }}>
            {runDescription}
          </div>
        </div>

        <div style={{ height: '1px', background: theme.borderInner }} />

        {/* Explorer preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{
            display: 'flex', gap: '16px', borderBottom: `1px solid ${theme.borderInner}`,
            paddingBottom: '8px', marginBottom: '4px',
          }}>
            <span style={{
              fontSize: '11px', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.12em',
              color: theme.accent,
              borderBottom: `2px solid ${theme.accent}`,
              paddingBottom: '6px',
            }}>
              Explorer
            </span>
            <span style={{
              fontSize: '11px', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.12em',
              color: theme.textMuted,
              paddingBottom: '6px',
            }}>
              Tasks
            </span>
          </div>

          {/* File tree mockup */}
          <div style={{
            fontSize: '10px', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.12em',
            color: theme.textMuted, marginBottom: '4px',
          }}>
            Project Files
          </div>
          {[
            { type: 'folder', name: 'src/features' },
            { type: 'file', name: 'auth.service.ts', active: true },
            { type: 'file', name: 'session.provider.ts', active: false },
          ].map((item) => (
            <div
              key={item.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 8px',
                borderRadius: '8px',
                fontSize: '13px',
                background: item.active ? theme.accentSoft : 'transparent',
                color: item.active ? theme.accent : theme.textMuted,
                border: item.active ? `1px solid ${theme.accent}22` : '1px solid transparent',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: '12px' }}>
                {item.type === 'folder' ? '📁' : '📄'}
              </span>
              <span style={{ fontWeight: item.active ? 500 : 400 }}>{item.name}</span>
            </div>
          ))}
        </div>

        <div style={{ height: '1px', background: theme.borderInner }} />

        {/* Artifacts mockup */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{
            fontSize: '10px', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.12em',
            color: theme.textMuted, marginBottom: '4px',
          }}>
            Artifacts
          </div>
          <div
            style={{
              background: theme.bgElevated,
              border: `1px solid ${theme.borderInner}`,
              borderRadius: '12px',
              padding: '12px',
              cursor: 'pointer',
            }}
          >
            <p style={{
              margin: 0, fontSize: '11px',
              fontFamily: "'JetBrains Mono', monospace",
              color: theme.textMuted, marginBottom: '4px',
            }}>
              DESIGN.md
            </p>
            <p style={{
              margin: 0, fontSize: '12px',
              color: theme.textSecondary, fontWeight: 500,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              Update system visual specs…
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
