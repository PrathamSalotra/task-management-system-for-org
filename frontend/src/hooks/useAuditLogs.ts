'use client';

import { useQuery } from '@tanstack/react-query';
import { getAuditLogsApi } from '../lib/api';

export function useAuditLogs() {
  return useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => getAuditLogsApi(),
  });
}
