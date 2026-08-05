import { prisma } from '../../prisma/client';

export class AuditService {
  async getAuditLogs() {
    return prisma.auditLog.findMany({
      orderBy: {
        timestamp: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      take: 100, // Limit to recent 100 logs for performance
    });
  }
}

export const auditService = new AuditService();
