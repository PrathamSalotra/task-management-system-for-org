import { apiRequest } from './client';
import { AuditLog } from './types';

export async function getAuditLogsApi(): Promise<AuditLog[]> {
  const response = await apiRequest<AuditLog[]>('/audit-logs', { method: 'GET' });
  return response;
}
