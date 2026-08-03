import { apiRequest } from './client';
import { Task, Comment, Attachment, PaginatedResponse } from './types';

export interface GetTasksParams {
  status?: string;
  priority?: string;
  assignee?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export async function getProjectTasksApi(
  projectId: string,
  params: GetTasksParams = {}
): Promise<PaginatedResponse<Task>> {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.priority) query.set('priority', params.priority);
  if (params.assignee) query.set('assignee', params.assignee);
  if (params.search) query.set('search', params.search);
  if (params.page) query.set('page', params.page.toString());
  if (params.pageSize) query.set('pageSize', params.pageSize.toString());

  const queryString = query.toString();
  const endpoint = queryString
    ? `/projects/${projectId}/tasks?${queryString}`
    : `/projects/${projectId}/tasks`;
  return apiRequest<PaginatedResponse<Task>>(endpoint, {
    method: 'GET',
  });
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  projectId: string;
  assigneeId: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | string;
  status?: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | string;
  dueDate?: string;
}

export async function createTaskApi(data: CreateTaskPayload): Promise<Task> {
  return apiRequest<Task>('/tasks', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  assigneeId?: string;
  priority?: string;
  status?: string;
  dueDate?: string;
}

export async function updateTaskApi(id: string, data: UpdateTaskPayload): Promise<Task> {
  return apiRequest<Task>(`/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteTaskApi(id: string): Promise<void> {
  return apiRequest<void>(`/tasks/${id}`, {
    method: 'DELETE',
  });
}

export async function getTaskCommentsApi(taskId: string): Promise<Comment[]> {
  return apiRequest<Comment[]>(`/tasks/${taskId}/comments`, {
    method: 'GET',
  });
}

export async function createTaskCommentApi(
  taskId: string,
  content: string
): Promise<Comment> {
  return apiRequest<Comment>(`/tasks/${taskId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

export async function uploadTaskAttachmentApi(
  taskId: string,
  file: File
): Promise<Attachment> {
  const formData = new FormData();
  formData.append('file', file);

  return apiRequest<Attachment>(`/tasks/${taskId}/attachments`, {
    method: 'POST',
    body: formData,
  });
}

export async function getTaskAttachmentsApi(
  taskId: string
): Promise<Attachment[]> {
  return apiRequest<Attachment[]>(`/tasks/${taskId}/attachments`, {
    method: 'GET',
  });
}
