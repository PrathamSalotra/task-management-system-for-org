import { Request, Response } from 'express';
import { auditService } from './audit.service';

export class AuditController {
  async getAuditLogs(req: Request, res: Response) {
    try {
      const logs = await auditService.getAuditLogs();
      res.status(200).json(logs);
    } catch (error: any) {
      console.error('Error fetching audit logs:', error);
      res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
  }
}

export const auditController = new AuditController();
