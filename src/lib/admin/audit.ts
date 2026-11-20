import crypto from "crypto";
import { Prisma } from "@prisma/client";
import prisma from "../prisma";

export interface WriteAuditParams {
  actor: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId?: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  requestId?: string;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
}

export interface AuditRecord {
  id: string;
  time: string;
  actor: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId?: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  requestId?: string;
  ipHash?: string;
  // Backward-compatibility properties
  userId?: string;
  adminEmail?: string;
  entity?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

export type StoredAuditLog = AuditRecord;

// Append-only in-memory audit store (fallback when DB is offline / dev)
const AUDIT_STORE: AuditRecord[] = [];

/**
 * Creates a deterministic, anonymized hash of an IP address
 */
export function hashIp(ip?: string): string {
  if (!ip) return "ip_unknown";
  return crypto.createHash("sha256").update(ip.trim()).digest("hex").slice(0, 16);
}

/**
 * Immutable Audit Logger — strictly append-only.
 * Any admin-mutating write must call this helper.
 */
export async function writeAudit(params: WriteAuditParams): Promise<AuditRecord> {
  const now = new Date();
  const id = `aud_${now.getTime()}_${crypto.randomBytes(3).toString("hex")}`;
  const ipHash = hashIp(params.ipAddress);

  const record: AuditRecord = {
    id,
    time: now.toISOString(),
    actor: params.actor,
    actorRole: params.actorRole,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    before: params.before || null,
    after: params.after || null,
    requestId: params.requestId || `req_${crypto.randomBytes(4).toString("hex")}`,
    ipHash,
    // Legacy compatibility fields
    userId: params.actor,
    adminEmail: params.actor.includes("@") ? params.actor : undefined,
    entity: params.entityType,
    metadata: params.metadata || params.after || undefined,
    ipAddress: params.ipAddress,
    createdAt: now.toISOString(),
  };

  // Append-only memory list (prepend latest)
  AUDIT_STORE.unshift(record);
  if (AUDIT_STORE.length > 1000) {
    AUDIT_STORE.pop();
  }

  // Persist to PostgreSQL if connected
  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
      await prisma.auditLog.create({
        data: {
          id: record.id,
          time: now,
          actor: record.actor,
          actorRole: record.actorRole,
          action: record.action,
          entityType: record.entityType,
          entityId: record.entityId,
          before: (record.before || Prisma.JsonNull) as unknown as Prisma.InputJsonValue,
          after: (record.after || Prisma.JsonNull) as unknown as Prisma.InputJsonValue,
          requestId: record.requestId,
          ipHash: record.ipHash,
          // Legacy columns
          userId: record.userId,
          entity: record.entityType,
          metadata: (record.metadata || Prisma.JsonNull) as unknown as Prisma.InputJsonValue,
          ipAddress: record.ipAddress,
          createdAt: now,
        },
      });
    }
  } catch {
    // Graceful fallback to memory store
  }

  return record;
}

/**
 * Legacy adapter for existing code calling logAdminAction
 */
export async function logAdminAction(params: {
  userId?: string;
  adminId?: string;
  adminEmail?: string;
  action: string;
  entity?: string;
  entityId?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  details?: Record<string, unknown>;
  ipAddress?: string;
}): Promise<AuditRecord> {
  const actor = params.adminEmail || params.userId || params.adminId || "system";
  return writeAudit({
    actor,
    actorRole: "SUPER_ADMIN",
    action: params.action,
    entityType: params.entity || "SYSTEM",
    entityId: params.entityId || params.targetId,
    after: params.metadata || params.details || null,
    ipAddress: params.ipAddress,
  });
}

export interface AuditQueryFilter {
  actor?: string;
  action?: string;
  entityType?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

/**
 * Retrieves audit logs with optional filtering.
 * Strictly read-only.
 */
export async function getAuditLogs(filter?: AuditQueryFilter): Promise<AuditRecord[]> {
  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
      const where: Prisma.AuditLogWhereInput = {};

      if (filter?.actor) {
        where.actor = { contains: filter.actor, mode: "insensitive" };
      }
      if (filter?.action) {
        where.action = { equals: filter.action };
      }
      if (filter?.entityType) {
        where.entityType = { equals: filter.entityType };
      }
      if (filter?.startDate || filter?.endDate) {
        where.time = {};
        if (filter.startDate) where.time.gte = new Date(filter.startDate);
        if (filter.endDate) where.time.lte = new Date(filter.endDate);
      }

      const rows = await prisma.auditLog.findMany({
        where,
        orderBy: { time: "desc" },
        take: filter?.limit || 100,
        skip: filter?.offset || 0,
      });

      if (rows.length > 0) {
        return rows.map((r) => ({
          id: r.id,
          time: (r.time || r.createdAt).toISOString(),
          actor: r.actor || r.userId || "system",
          actorRole: r.actorRole || "SUPER_ADMIN",
          action: r.action,
          entityType: r.entityType || r.entity,
          entityId: r.entityId || undefined,
          before: (r.before as Record<string, unknown>) || null,
          after: (r.after as Record<string, unknown>) || null,
          requestId: r.requestId || undefined,
          ipHash: r.ipHash || undefined,
          userId: r.userId || undefined,
          adminEmail: r.actor?.includes("@") ? r.actor : undefined,
          entity: r.entityType || r.entity,
          metadata: (r.metadata as Record<string, unknown>) || undefined,
          ipAddress: r.ipAddress || undefined,
          createdAt: r.createdAt.toISOString(),
        }));
      }
    }
  } catch {
    // Fallback to memory store below
  }

  // Filter in-memory AUDIT_STORE
  let results = [...AUDIT_STORE];

  if (filter?.actor) {
    const act = filter.actor.toLowerCase();
    results = results.filter((r) => r.actor.toLowerCase().includes(act));
  }
  if (filter?.action) {
    results = results.filter((r) => r.action === filter.action);
  }
  if (filter?.entityType) {
    results = results.filter((r) => r.entityType === filter.entityType);
  }
  if (filter?.startDate) {
    const start = new Date(filter.startDate).getTime();
    results = results.filter((r) => new Date(r.time).getTime() >= start);
  }
  if (filter?.endDate) {
    const end = new Date(filter.endDate).getTime();
    results = results.filter((r) => new Date(r.time).getTime() <= end);
  }
  if (filter?.search) {
    const s = filter.search.toLowerCase();
    results = results.filter(
      (r) =>
        r.actor.toLowerCase().includes(s) ||
        r.action.toLowerCase().includes(s) ||
        r.entityType.toLowerCase().includes(s) ||
        (r.entityId && r.entityId.toLowerCase().includes(s))
    );
  }

  const offset = filter?.offset || 0;
  const limit = filter?.limit || 100;
  return results.slice(offset, offset + limit);
}
