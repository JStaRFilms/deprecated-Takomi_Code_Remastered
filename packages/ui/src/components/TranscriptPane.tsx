import type { ReactElement } from 'react';
import type { TranscriptPart, TranscriptRenderBlock } from '@takomi/contracts';
import type { ThemeTokens } from '../theme';

export interface TranscriptPaneProps {
  readonly theme: ThemeTokens;
  readonly parts: readonly TranscriptPart[];
  readonly blocks?: readonly TranscriptRenderBlock[] | undefined;
  readonly sessionName: string;
}

/** Center stage: transcript message stream */
export function TranscriptPane({
  theme,
  parts,
  blocks,
  sessionName,
}: TranscriptPaneProps): ReactElement {
  const renderBlocks = blocks ?? [];
  const hasRenderBlocks = renderBlocks.length > 0;

  return (
    <div
      data-component="transcript-pane"
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '48px 32px 240px',
        maxWidth: '768px',
        margin: '0 auto',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '32px',
      }}
    >
      {!hasRenderBlocks && parts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <div style={{
            fontSize: '28px',
            fontWeight: 700,
            color: theme.textPrimary,
            marginBottom: '8px',
            letterSpacing: '-0.02em',
          }}>
            {sessionName}
          </div>
          <p style={{ color: theme.textMuted, fontSize: '14px', margin: 0 }}>
            Start a conversation to begin orchestrating.
          </p>
        </div>
      ) : null}

      {hasRenderBlocks
        ? renderBlocks.map((block) => {
            if (block.kind === 'user-message') {
              return (
                <div
                  key={block.id}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}
                >
                  <div
                    style={{
                      background: theme.bgInput,
                      border: `1px solid ${theme.borderInner}`,
                      padding: '16px 20px',
                      borderRadius: '24px 24px 4px 24px',
                      maxWidth: '85%',
                      fontSize: '15px',
                      lineHeight: 1.6,
                      color: theme.textPrimary,
                      fontWeight: 500,
                    }}
                  >
                    {block.text}
                  </div>
                </div>
              );
            }

            if (block.kind === 'assistant-message') {
              return (
                <div
                  key={block.id}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <div
                      style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '4px',
                        background: theme.accent,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: theme.textInverse,
                        fontWeight: 800,
                        fontSize: '9px',
                      }}
                    >
                      T
                    </div>
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                        color: theme.textPrimary,
                      }}
                    >
                      Takomi
                    </span>
                  </div>
                  <div
                    style={{
                      maxWidth: '85%',
                      fontSize: '15px',
                      lineHeight: 1.6,
                      color: theme.textSecondary,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {block.text}
                  </div>
                </div>
              );
            }

            if (block.kind === 'command') {
              return (
                <div
                  key={block.id}
                  style={{
                    background: theme.codeBlockBg,
                    border: `1px solid ${
                      block.status === 'failed' ? theme.danger : theme.borderInner
                    }`,
                    borderRadius: '16px',
                    padding: '14px 16px',
                    maxWidth: '640px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: '13px',
                          color: theme.textPrimary,
                          fontWeight: 600,
                        }}
                      >
                        {block.command}
                      </div>
                      {block.logs ? (
                        <div
                          style={{
                            marginTop: '8px',
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: '11px',
                            color: theme.textMuted,
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          {block.logs}
                        </div>
                      ) : null}
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: block.status === 'failed' ? theme.danger : theme.textMuted,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                      }}
                    >
                      {block.status}
                    </div>
                  </div>
                </div>
              );
            }

            if (block.kind === 'file-change') {
              return (
                <div
                  key={block.id}
                  style={{
                    background: theme.bgElevated,
                    border: `1px solid ${theme.borderInner}`,
                    borderRadius: '16px',
                    padding: '14px 16px',
                    maxWidth: '640px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '10px',
                    }}
                  >
                    <span style={{ fontSize: '12px', fontWeight: 700, color: theme.textPrimary }}>
                      {block.count} Files Modified
                    </span>
                    <span style={{ fontSize: '11px', color: theme.textMuted, textTransform: 'uppercase' }}>
                      {block.status}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {block.files.map((file) => (
                      <div
                        key={`${block.id}-${file.path}`}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: '12px',
                          fontSize: '12px',
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            color: theme.textPrimary,
                          }}
                        >
                          {file.path}
                        </span>
                        <span style={{ color: theme.textMuted }}>{file.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }

            if (block.kind === 'plan') {
              return (
                <div
                  key={block.id}
                  style={{
                    background: theme.accentSoft,
                    border: `1px solid ${theme.accentGlow}`,
                    borderRadius: '16px',
                    padding: '14px 16px',
                    maxWidth: '640px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: theme.accent,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      marginBottom: '10px',
                    }}
                  >
                    {block.title}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {block.steps.map((step, index) => (
                      <div
                        key={`${block.id}-${index}`}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
                      >
                        <span style={{ color: theme.accent }}>{step.status === 'completed' ? 'o' : step.status === 'in-progress' ? '>' : '-'}</span>
                        <span style={{ color: theme.textSecondary, fontSize: '13px' }}>{step.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }

            if (block.kind === 'intervention-card') {
              return (
                <div
                  key={block.id}
                  style={{
                    background: theme.warningSoft,
                    border: `1px solid ${theme.warning}`,
                    borderRadius: '14px',
                    padding: '12px 16px',
                    maxWidth: '640px',
                    color: theme.warning,
                    fontWeight: 600,
                  }}
                >
                  {block.text}
                </div>
              );
            }

            if (block.kind === 'completion-state') {
              return (
                <div
                  key={block.id}
                  style={{
                    background: block.status === 'completed' ? theme.successSoft : theme.dangerSoft,
                    border: `1px solid ${block.status === 'completed' ? theme.success : theme.danger}`,
                    borderRadius: '14px',
                    padding: '12px 16px',
                    maxWidth: '640px',
                    color: block.status === 'completed' ? theme.success : theme.danger,
                    fontWeight: 600,
                  }}
                >
                  {block.summary}
                </div>
              );
            }

            if (block.kind === 'artifact-summary') {
              return (
                <div
                  key={block.id}
                  style={{
                    background: theme.bgElevated,
                    border: `1px solid ${theme.borderInner}`,
                    borderRadius: '12px',
                    padding: '12px 16px',
                    fontSize: '12px',
                    color: theme.textMuted,
                    maxWidth: '640px',
                  }}
                >
                  Artifact: {block.label}
                </div>
              );
            }

            return (
              <div
                key={block.id}
                style={{
                  fontSize: '11px',
                  color: theme.textMuted,
                  textAlign: 'center',
                  fontFamily: "'JetBrains Mono', monospace",
                  padding: '8px 0',
                }}
              >
                {block.kind === 'system-message' || block.kind === 'status-message'
                  ? block.text
                  : ''}
              </div>
            );
          })
        : parts.map((part) => {
        if (part.kind === 'text') {
          const isUser = part.role === 'user';
          return (
            <div
              key={part.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isUser ? 'flex-end' : 'flex-start',
              }}
            >
              {!isUser ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px',
                }}>
                  <div style={{
                    width: '16px', height: '16px', borderRadius: '4px',
                    background: theme.accent,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: theme.textInverse, fontWeight: 800, fontSize: '9px',
                  }}>
                    T
                  </div>
                  <span style={{
                    fontSize: '12px', fontWeight: 700, letterSpacing: '0.04em', color: theme.textPrimary,
                  }}>
                    Takomi
                  </span>
                </div>
              ) : null}

              <div
                style={{
                  background: isUser ? theme.bgInput : 'transparent',
                  border: isUser ? `1px solid ${theme.borderInner}` : 'none',
                  padding: isUser ? '16px 20px' : '0',
                  borderRadius: isUser ? '24px 24px 4px 24px' : '0',
                  maxWidth: '85%',
                  fontSize: '15px',
                  lineHeight: 1.6,
                  color: isUser ? theme.textPrimary : theme.textSecondary,
                  fontWeight: isUser ? 500 : 400,
                }}
              >
                {part.text}
              </div>
            </div>
          );
        }

        if (part.kind === 'tool-call') {
          return (
            <div
              key={part.id}
              style={{
                background: theme.codeBlockBg,
                border: `1px solid ${theme.borderInner}`,
                borderRadius: '16px',
                overflow: 'hidden',
                maxWidth: '640px',
              }}
            >
              <div style={{
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}>
                <div style={{
                  padding: '6px',
                  background: theme.hover,
                  borderRadius: '6px',
                  color: theme.textPrimary,
                  fontSize: '11px',
                  fontWeight: 600,
                }}>
                  ▶
                </div>
                <div>
                  <p style={{
                    margin: 0, fontSize: '12px', fontWeight: 600,
                    color: theme.textSecondary,
                  }}>
                    {part.toolName}
                  </p>
                  <p style={{
                    margin: '2px 0 0',
                    fontSize: '10px',
                    fontFamily: "'JetBrains Mono', monospace",
                    color: theme.textMuted,
                  }}>
                    {JSON.stringify(part.input).slice(0, 60)}
                  </p>
                </div>
              </div>
            </div>
          );
        }

        if (part.kind === 'tool-result') {
          return (
            <div
              key={part.id}
              style={{
                background: theme.codeBlockBg,
                border: `1px solid ${theme.borderInner}`,
                borderRadius: '16px',
                padding: '12px 16px',
                maxWidth: '640px',
              }}
            >
              <p style={{
                margin: 0,
                fontSize: '10px',
                fontFamily: "'JetBrains Mono', monospace",
                color: theme.textMuted,
                whiteSpace: 'pre-wrap',
              }}>
                ← {part.toolName} result
              </p>
            </div>
          );
        }

        if (part.kind === 'status') {
          return (
            <div
              key={part.id}
              style={{
                background: theme.warningSoft,
                border: `1px solid ${theme.warning}33`,
                padding: '12px 16px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '13px',
                fontWeight: 500,
                color: theme.warning,
                maxWidth: '640px',
              }}
            >
              ⚠ {part.message ?? part.status}
            </div>
          );
        }

        /* system messages */
        if (part.kind === 'system') {
          return (
            <div
              key={part.id}
              style={{
                fontSize: '11px',
                color: theme.textMuted,
                textAlign: 'center',
                fontFamily: "'JetBrains Mono', monospace",
                padding: '8px 0',
              }}
            >
              {part.message}
            </div>
          );
        }

        /* artifact */
        return (
          <div
            key={part.id}
            style={{
              background: theme.bgElevated,
              border: `1px solid ${theme.borderInner}`,
              borderRadius: '12px',
              padding: '12px 16px',
              fontSize: '12px',
              color: theme.textMuted,
              maxWidth: '640px',
            }}
          >
            📎 Artifact: {part.label ?? part.artifactId}
          </div>
        );
      })}
    </div>
  );
}
