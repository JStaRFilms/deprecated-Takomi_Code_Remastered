import type {
  SessionDescriptor,
  SessionLineage
} from '@takomi/contracts';

/**
 * In-memory registry that tracks session parent-child relationships.
 * The OrchestrationSession contract stores rootSessionId but not immediate
 * parentSessionId. This registry bridges that gap for lineage computation.
 */
export class SessionLineageRegistry {
  private parentMap = new Map<string, string>();
  private sessionMap = new Map<string, SessionDescriptor>();

  /**
   * Registers a session and its parent relationship.
   */
  register(session: SessionDescriptor): void {
    this.sessionMap.set(session.id, session);
    if (session.parentSessionId) {
      this.parentMap.set(session.id, session.parentSessionId);
    }
  }

  /**
   * Gets the parent session ID for a session.
   */
  getParentId(sessionId: string): string | null {
    return this.parentMap.get(sessionId) ?? null;
  }

  /**
   * Gets a registered session descriptor.
   */
  getDescriptor(sessionId: string): SessionDescriptor | null {
    return this.sessionMap.get(sessionId) ?? null;
  }

  /**
   * Removes a session from the registry.
   */
  unregister(sessionId: string): void {
    this.parentMap.delete(sessionId);
    this.sessionMap.delete(sessionId);
  }

  /**
   * Clears all registered session descriptors and parent relationships.
   */
  clear(): void {
    this.parentMap.clear();
    this.sessionMap.clear();
  }

  /**
   * Gets all registered session descriptors.
   */
  getAllDescriptors(): IterableIterator<[string, SessionDescriptor]> {
    return this.sessionMap.entries();
  }
}

/**
 * Builds session lineage from the parent chain tracked in the registry.
 * Same-workspace inheritance is the default — child sessions inherit
 * their parent's workspace unless explicitly overridden.
 */
export function resolveSessionLineage(
  session: SessionDescriptor,
  registry: SessionLineageRegistry
): SessionLineage {
  if (!session.parentSessionId) {
    return {
      rootSessionId: session.id,
      parentSessionId: null,
      ancestorSessionIds: [],
      depth: 0,
      inheritsWorkspace: true,
      inheritedWorktreeId: session.worktreeId ?? null
    };
  }

  const ancestors: string[] = [];
  let currentParentId: string | null = session.parentSessionId;
  let depth = 0;

  while (currentParentId) {
    ancestors.push(currentParentId);
    depth += 1;

    const grandParentId = registry.getParentId(currentParentId);
    if (!grandParentId) {
      break;
    }
    currentParentId = grandParentId;
  }

  const rootSessionId = ancestors.length > 0
    ? ancestors[ancestors.length - 1]!
    : session.id;

  return {
    rootSessionId,
    parentSessionId: session.parentSessionId,
    ancestorSessionIds: ancestors,
    depth,
    inheritsWorkspace: true,
    inheritedWorktreeId: session.worktreeId ?? null
  };
}

/**
 * Collects all descendant session IDs for a given root session.
 * Useful for session-tree rendering and bulk operations.
 */
export function collectDescendantSessionIds(
  rootSessionId: string,
  registry: SessionLineageRegistry
): readonly string[] {
  const descendants: string[] = [];

  function walk(currentId: string): void {
    for (const [, descriptor] of registry.getAllDescriptors()) {
      if (descriptor.parentSessionId === currentId) {
        descendants.push(descriptor.id);
        walk(descriptor.id);
      }
    }
  }

  walk(rootSessionId);
  return descendants;
}

/**
 * Checks whether a session is an ancestor of another session.
 */
export function isAncestor(
  candidateAncestorId: string,
  sessionId: string,
  registry: SessionLineageRegistry
): boolean {
  let currentId: string | null = sessionId;
  const visited = new Set<string>();

  while (currentId) {
    if (visited.has(currentId)) {
      return false;
    }
    visited.add(currentId);

    if (currentId === candidateAncestorId) {
      return true;
    }

    const parentId = registry.getParentId(currentId);
    if (!parentId) {
      return false;
    }
    currentId = parentId;
  }

  return false;
}

/**
 * Gets the full path from root to a specific session.
 */
export function getSessionPath(
  sessionId: string,
  registry: SessionLineageRegistry
): readonly SessionDescriptor[] {
  const path: SessionDescriptor[] = [];
  let currentId: string | null = sessionId;
  const visited = new Set<string>();

  while (currentId) {
    if (visited.has(currentId)) {
      break;
    }
    visited.add(currentId);

    const descriptor = registry.getDescriptor(currentId);
    if (!descriptor) {
      break;
    }
    path.unshift(descriptor);
    currentId = registry.getParentId(currentId);
  }

  return path;
}
