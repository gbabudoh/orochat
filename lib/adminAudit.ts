import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

interface LogAdminActionOptions {
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}

export function logAdminAction(adminId: string, action: string, opts: LogAdminActionOptions = {}) {
  return db.adminAuditLog
    .create({
      data: {
        adminId,
        action,
        targetType: opts.targetType,
        targetId: opts.targetId,
        metadata: opts.metadata as Prisma.InputJsonValue | undefined,
      },
    })
    .catch((err) => console.error('Failed to write admin audit log:', err));
}
