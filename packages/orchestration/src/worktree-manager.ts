/**
 * Takomi Orchestration - Worktree Manager
 *
 * Manages worktree assignment for session subtrees.
 *
 * Product rules:
 * - Same-workspace inheritance is the default for child sessions.
 * - Worktree switching is always explicit and must declare its scope.
 * - Only descendants still inheriting the prior workspace/worktree may be
 *   bulk-updated automatically.
 */

import type {
  SessionDescriptor,
  WorktreeReference,
  WorkspaceDescriptor,
} from '@takomi/contracts';

import {
  collectDescendantSessionIds,
  type SessionLineageRegistry,
} from './session-lineage.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Describes the scope of a worktree switch operation.
 */
export interface WorktreeSwitchScope {
  readonly targetSessionId: string;
  readonly affectedSessionIds: readonly string[];
  readonly skippedSessionIds: readonly string[];
  readonly reason: string;
}

/**
 * Result of a worktree switch operation on a session subtree.
 */
export interface WorktreeSwitchResult {
  readonly scope: WorktreeSwitchScope;
  readonly previousWorktreeId: string | null;
  readonly newWorktreeId: string;
  readonly updatedDescriptors: readonly SessionDescriptor[];
}

/**
 * Configuration for worktree reassignment.
 */
export interface WorktreeReassignmentConfig {
  readonly workspaceId: string;
  readonly newWorktreeId: string;
  readonly newWorktreePath: string | null;
  readonly sessionSubtreeRootSessionId?: string | undefined;
  readonly reason?: string | undefined;
}

// ---------------------------------------------------------------------------
// Worktree Manager
// ---------------------------------------------------------------------------

/**
 * The WorktreeManager handles worktree assignment scoped to session subtrees.
 *
 * It integrates with the SessionLineageRegistry to determine which sessions
 * should be affected by a worktree change, respecting inheritance rules.
 */
export class WorktreeManager {
  private readonly lineageRegistry: SessionLineageRegistry;

  constructor(lineageRegistry: SessionLineageRegistry) {
    this.lineageRegistry = lineageRegistry;
  }

  /**
   * Computes the scope of a worktree switch for a given session.
   *
   * If sessionSubtreeRootSessionId is provided, only descendants of that
   * session that are still inheriting the previous worktree will be affected.
   *
   * Sessions that have already been explicitly reassigned to a different
   * worktree are skipped to avoid silently mutating unrelated trees.
   */
  computeSwitchScope(
    targetSessionId: string,
    previousWorktreeId: string | null,
    newWorktreeId: string,
    reason: string
  ): WorktreeSwitchScope {
    const descriptor = this.lineageRegistry.getDescriptor(targetSessionId);

    if (!descriptor) {
      return {
        targetSessionId,
        affectedSessionIds: [targetSessionId],
        skippedSessionIds: [],
        reason,
      };
    }

    // Collect all descendants
    const allDescendants = collectDescendantSessionIds(targetSessionId, this.lineageRegistry);

    const affectedSessionIds: string[] = [targetSessionId];
    const skippedSessionIds: string[] = [];

    for (const descendantId of allDescendants) {
      const descendant = this.lineageRegistry.getDescriptor(descendantId);
      if (!descendant) {
        skippedSessionIds.push(descendantId);
        continue;
      }

      // Rule: only descendants still inheriting the prior worktree may be
      // bulk-updated. If a descendant has already been explicitly reassigned
      // to a different worktree, skip it.
      if (
        descendant.worktreeId !== null &&
        descendant.worktreeId !== previousWorktreeId
      ) {
        skippedSessionIds.push(descendantId);
        continue;
      }

      affectedSessionIds.push(descendantId);
    }

    return {
      targetSessionId,
      affectedSessionIds,
      skippedSessionIds,
      reason,
    };
  }

  /**
   * Applies a worktree reassignment to the session subtree.
   *
   * Returns the list of updated descriptors. Does NOT mutate persistence
   * directly — callers are responsible for persisting changes.
   */
  applyWorktreeSwitch(
    config: WorktreeReassignmentConfig
  ): WorktreeSwitchResult {
    const rootSessionId = config.sessionSubtreeRootSessionId ?? '';
    const descriptor = this.lineageRegistry.getDescriptor(rootSessionId);

    const previousWorktreeId = descriptor?.worktreeId ?? null;

    const scope = this.computeSwitchScope(
      rootSessionId,
      previousWorktreeId,
      config.newWorktreeId,
      config.reason ?? 'explicit worktree switch'
    );

    const updatedDescriptors: SessionDescriptor[] = [];

    for (const sessionId of scope.affectedSessionIds) {
      const desc = this.lineageRegistry.getDescriptor(sessionId);
      if (!desc) continue;

      const updated: SessionDescriptor = {
        ...desc,
        worktreeId: config.newWorktreeId,
        worktreePath: config.newWorktreePath,
        updatedAt: new Date().toISOString(),
        lineage: desc.lineage
          ? {
              ...desc.lineage,
              inheritsWorkspace: true,
              inheritedWorktreeId: config.newWorktreeId,
            }
          : undefined,
      };

      this.lineageRegistry.register(updated);
      updatedDescriptors.push(updated);
    }

    return {
      scope,
      previousWorktreeId,
      newWorktreeId: config.newWorktreeId,
      updatedDescriptors,
    };
  }

  /**
   * Checks whether a session is eligible for worktree reassignment.
   * A session is eligible if it or any ancestor hasn't been explicitly
   * assigned to a different worktree.
   */
  isEligibleForWorktreeSwitch(
    sessionId: string,
    currentWorktreeId: string | null
  ): boolean {
    const descriptor = this.lineageRegistry.getDescriptor(sessionId);
    if (!descriptor) return true;

    // If the session has been explicitly assigned to a different worktree,
    // it's NOT eligible for automatic bulk reassignment
    if (
      descriptor.worktreeId !== null &&
      descriptor.worktreeId !== currentWorktreeId
    ) {
      return false;
    }

    return true;
  }

  /**
   * Gets all sessions affected by a worktree in a workspace.
   */
  getSessionsForWorktree(
    worktreeId: string
  ): readonly SessionDescriptor[] {
    const results: SessionDescriptor[] = [];

    for (const [, descriptor] of this.lineageRegistry.getAllDescriptors()) {
      if (descriptor.worktreeId === worktreeId) {
        results.push(descriptor);
      }
    }

    return results;
  }
}

// ---------------------------------------------------------------------------
// Helper: Build workspace descriptor with worktree list
// ---------------------------------------------------------------------------

/**
 * Enriches a workspace descriptor with worktree references and active context.
 */
export function enrichWorkspaceWithWorktrees(
  workspace: WorkspaceDescriptor,
  worktrees: readonly WorktreeReference[]
): WorkspaceDescriptor {
  const activeWorktree = worktrees.find(wt => wt.active) ?? null;

  return {
    ...workspace,
    worktrees: [...worktrees],
    currentWorktreeId: activeWorktree?.id ?? workspace.currentWorktreeId ?? null,
  };
}
