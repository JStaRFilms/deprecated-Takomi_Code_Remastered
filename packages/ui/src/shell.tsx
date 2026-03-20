import type { SessionDescriptor, WorkspaceDescriptor } from '@takomi/contracts';
import { uiTokens } from './tokens';

export interface AppShellProps {
  readonly workspace: WorkspaceDescriptor;
  readonly sessions: readonly SessionDescriptor[];
  readonly headline?: string;
}

export function AppShell({
  workspace,
  sessions,
  headline = 'Takomi Code'
}: AppShellProps): JSX.Element {
  return (
    <div
      data-component="app-shell"
      style={{
        color: uiTokens.text,
        background: `linear-gradient(180deg, ${uiTokens.background} 0%, ${uiTokens.backgroundSoft} 100%)`,
        minHeight: '100vh',
        padding: '32px'
      }}
    >
      <section
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          border: `1px solid ${uiTokens.border}`,
          borderRadius: '24px',
          background: uiTokens.surface,
          boxShadow: '0 24px 80px rgba(0, 0, 0, 0.24)',
          padding: '24px'
        }}
      >
        <header style={{ marginBottom: '24px' }}>
          <p style={{ margin: 0, color: uiTokens.accent }}>Shared React shell scaffold</p>
          <h1 style={{ margin: '8px 0 0', fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}>{headline}</h1>
          <p style={{ margin: '12px 0 0', color: uiTokens.textMuted }}>
            Workspace: {workspace.name} · Target: {workspace.target} · Sessions: {sessions.length}
          </p>
        </header>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px'
          }}
        >
          {sessions.map((session) => (
            <article
              key={session.id}
              style={{
                border: `1px solid ${uiTokens.border}`,
                borderRadius: '18px',
                padding: '16px',
                background: uiTokens.surfaceElevated
              }}
            >
              <strong>{session.name}</strong>
              <div style={{ color: uiTokens.textMuted, marginTop: '8px' }}>
                {session.kind} · {session.status}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
