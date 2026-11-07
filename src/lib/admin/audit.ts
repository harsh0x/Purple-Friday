import { Prisma } from "@prisma/client";
import prisma from "../prisma";

export interface LogAuditParams {
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
}

export interface StoredAuditLog {
  id: string;
  userId?: string;
  adminEmail?: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

const AUDIT_STORE: StoredAuditLog[] = [];

export async function logAdminAction(params: LogAuditParams): Promise<StoredAuditLog> {
  const logRecord: StoredAuditLog = {
    id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId: params.userId || params.adminId,
    adminEmail: params.adminEmail,
    action: params.action,
    entity: params.entity || "ADMIN_ACTION",
    entityId: params.entityId || params.targetId,
    metadata: params.metadata || params.details,
    ipAddress: params.ipAddress,
    createdAt: new Date().toISOString(),
  };

  AUDIT_STORE.unshift(logRecord);
  if (AUDIT_STORE.length > 500) {
    AUDIT_STORE.pop();
  }

  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
      await prisma.auditLog.create({
        data: {
          id: logRecord.id,
          userId: params.userId || params.adminId,
          action: params.action,
          entity: logRecord.entity,
          entityId: params.entityId || params.targetId,
          metadata: (params.metadata || params.details || {}) as unknown as Prisma.InputJsonValue,
          ipAddress: params.ipAddress,
        },
      });
    }
  } catch {
    // Memory fallback
  }

  return logRecord;
}

export function getAuditLogs(): StoredAuditLog[] {
  return [...AUDIT_STORE];
}
