import { apiRequest } from './client';
import { Project, ProjectMember, PaginatedResponse } from './types';

export interface GetProjectsParams {
  search?: string;
  status?: string;
  includeArchived?: boolean;
  page?: number;
  pageSize?: number;
}

export async function getProjectsApi(
  params: GetProjectsParams = {}
): Promise<PaginatedResponse<Project>> {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.status) query.set('status', params.status);
  if (params.includeArchived) query.set('includeArchived', 'true');
  if (params.page) query.set('page', params.page.toString());
  if (params.pageSize) query.set('pageSize', params.pageSize.toString());

  const queryString = query.toString();
  const endpoint = queryString ? `/projects?${queryString}` : '/projects';
  const res = await apiRequest<any>(endpoint, {
    method: 'GET',
  });

  if (Array.isArray(res)) {
    return {
      data: res,
      meta: {
        page: params.page || 1,
        pageSize: params.pageSize || res.length,
        total: res.length,
      },
    };
  }

  return res;
}

export async function getProjectByIdApi(id: string): Promise<Project> {
  return apiRequest<Project>(`/projects/${id}`, {
    method: 'GET',
  });
}

export interface CreateProjectPayload {
  name: string;
  description?: string;
  startDate: string;
  deadline: string;
}

export async function createProjectApi(data: CreateProjectPayload): Promise<Project> {
  return apiRequest<Project>('/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export interface UpdateProjectPayload {
  name?: string;
  description?: string;
  startDate?: string;
  deadline?: string;
  status?: string;
}

export async function updateProjectApi(
  id: string,
  data: UpdateProjectPayload
): Promise<Project> {
  return apiRequest<Project>(`/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteProjectApi(id: string): Promise<void> {
  return apiRequest<void>(`/projects/${id}`, {
    method: 'DELETE',
  });
}

export async function addProjectMemberApi(
  projectId: string,
  userId: string
): Promise<ProjectMember> {
  return apiRequest<ProjectMember>(`/projects/${projectId}/members`, {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
}

export async function removeProjectMemberApi(
  projectId: string,
  userId: string
): Promise<void> {
  return apiRequest<void>(`/projects/${projectId}/members/${userId}`, {
    method: 'DELETE',
  });
}
