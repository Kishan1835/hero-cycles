import { AuditAction, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { logger } from '../utils/logger';

interface AuditEntry {
  userId?: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  metadata?: Prisma.InputJsonValue;
}

/**
 * Fire-and-forget audit logging. Failures here are logged but never
 * thrown — an audit log write failure should not break the user-facing
 * operation it's recording.
 */
export async function recordAudit(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        metadata: entry.metadata,
      },
    });
  } catch (err) {
    logger.error('Failed to write audit log', { entry, err });
  }
}
