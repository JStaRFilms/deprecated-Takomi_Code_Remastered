import type {
  AuditEventEnvelope,
  PersistenceAdapter,
  ReadModelProvider,
  RuntimeEventEnvelope,
  TranscriptPart
} from '@takomi/contracts';

import { createInMemoryEventStore } from './event-store.js';
import { createInMemoryAuditEventStore } from './audit-store.js';
import { createInMemoryRestoreSnapshotStore } from './restore-snapshots.js';
import { createInMemoryInterventionStore } from './intervention-store.js';
import { createInMemoryTaskGraphStore } from './task-graph-store.js';
import { createInMemoryOrchestrationSessionStore } from './orchestration-session-store.js';
import { createInMemoryReadModelProvider } from './read-models.js';
import { createDesktopPersistenceAdapter } from './desktop-adapter.js';
import { createWebLocalPersistenceAdapter } from './web-adapter.js';

// ---------------------------------------------------------------------------
// In-memory adapter (development / testing)
// ---------------------------------------------------------------------------

/**
 * Creates an in-memory persistence adapter suitable for development and tests.
 * All data lives in process memory and is lost on restart.
 */
export function createInMemoryPersistenceAdapter(): PersistenceAdapter {
  const transcriptEvents = createInMemoryEventStore<TranscriptPart>();
  const runtimeEvents = createInMemoryEventStore<RuntimeEventEnvelope>();
  const auditEvents = createInMemoryAuditEventStore();
  const restoreSnapshots = createInMemoryRestoreSnapshotStore();
  const interventions = createInMemoryInterventionStore();
  const taskGraph = createInMemoryTaskGraphStore();
  const orchestrationSessions = createInMemoryOrchestrationSessionStore();

  const deps = {
    transcriptEvents,
    runtimeEvents,
    auditEvents,
    restoreSnapshots,
    interventions,
    taskGraph,
    orchestrationSessions
  };

  const readModels = createInMemoryReadModelProvider(deps);

  return {
    ...deps,
    readModels
  };
}

// ---------------------------------------------------------------------------
// Re-export sub-modules
// ---------------------------------------------------------------------------

export { createInMemoryEventStore } from './event-store.js';
export { createInMemoryAuditEventStore } from './audit-store.js';
export { createInMemoryRestoreSnapshotStore } from './restore-snapshots.js';
export { createInMemoryInterventionStore } from './intervention-store.js';
export { createInMemoryTaskGraphStore } from './task-graph-store.js';
export { createInMemoryOrchestrationSessionStore } from './orchestration-session-store.js';
export { createInMemoryReadModelProvider } from './read-models.js';
export { createDesktopPersistenceAdapter } from './desktop-adapter.js';
export { createWebLocalPersistenceAdapter } from './web-adapter.js';

// ---------------------------------------------------------------------------
// Re-export existing interop
// ---------------------------------------------------------------------------

export * from './interop.js';
