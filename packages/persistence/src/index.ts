import type { AuditEvent, ProjectDescriptor, SessionDescriptor, WorkspaceDescriptor } from '@takomi/contracts';

export interface Repository<TRecord extends { readonly id: string }> {
  list(): readonly TRecord[];
  get(id: string): TRecord | undefined;
  upsert(record: TRecord): void;
  remove(id: string): void;
}

export function createMemoryRepository<TRecord extends { readonly id: string }>(): Repository<TRecord> {
  const records = new Map<string, TRecord>();

  return {
    list: () => [...records.values()],
    get: (id) => records.get(id),
    upsert: (record) => {
      records.set(record.id, record);
    },
    remove: (id) => {
      records.delete(id);
    }
  };
}

export interface PersistenceBundle {
  readonly workspaces: Repository<WorkspaceDescriptor>;
  readonly projects: Repository<ProjectDescriptor>;
  readonly sessions: Repository<SessionDescriptor>;
  readonly auditEvents: Repository<AuditEvent>;
}

export function createPersistenceBundle(): PersistenceBundle {
  return {
    workspaces: createMemoryRepository<WorkspaceDescriptor>(),
    projects: createMemoryRepository<ProjectDescriptor>(),
    sessions: createMemoryRepository<SessionDescriptor>(),
    auditEvents: createMemoryRepository<AuditEvent>()
  };
}
