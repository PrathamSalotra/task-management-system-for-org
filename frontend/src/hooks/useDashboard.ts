'use client';

import { useQuery } from '@tanstack/react-query';
import { getDashboardOverviewApi, getTeamPerformanceApi } from '../lib/api';

export function useDashboardOverview() {
  return useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: () => getDashboardOverviewApi(),
  });
}

export function useTeamPerformance(enabled = true) {
  return useQuery({
    queryKey: ['dashboard', 'team-performance'],
    queryFn: () => getTeamPerformanceApi(),
    enabled,
  });
}
