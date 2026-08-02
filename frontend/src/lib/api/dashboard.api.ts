import { apiRequest } from './client';
import { DashboardOverviewResult, TeamMemberPerformance } from './types';

export async function getDashboardOverviewApi(): Promise<DashboardOverviewResult> {
  return apiRequest<DashboardOverviewResult>('/dashboard/overview', {
    method: 'GET',
  });
}

export async function getTeamPerformanceApi(): Promise<TeamMemberPerformance[]> {
  return apiRequest<TeamMemberPerformance[]>('/dashboard/team-performance', {
    method: 'GET',
  });
}
