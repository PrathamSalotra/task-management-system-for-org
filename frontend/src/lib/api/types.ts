export type Role = 'ADMIN' | 'PROJECT_MANAGER' | 'TEAM_MEMBER';
export type ProjectStatus = 'ACTIVE' | 'ARCHIVED' | 'COMPLETED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  updatedAt?: string;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  joinedAt: string;
  user?: User;
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  managerId: string;
  startDate: string;
  deadline: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt?: string;
  manager?: User;
  members?: ProjectMember[];
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  projectId: string;
  assigneeId?: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string | null;
  createdAt: string;
  updatedAt?: string;
  assignee?: User | null;
  _count?: {
    comments: number;
    attachments: number;
  };
}

export interface Comment {
  id: string;
  taskId: string;
  authorId: string;
  content: string;
  createdAt: string;
  author?: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
}

export interface Attachment {
  id: string;
  taskId: string;
  uploaderId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  uploader?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface Meta {
  page: number;
  pageSize: number;
  total: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: Meta;
}

export interface ProjectProgress {
  projectId: string;
  projectName: string;
  totalTasks: number;
  completedTasks: number;
  percentage: number;
}

export interface TaskStats {
  byStatus: Record<TaskStatus, number>;
  byPriority: Record<TaskPriority, number>;
}

export interface TeamMemberPerformance {
  userId: string;
  name: string;
  email: string;
  completedTasks: number;
  overdueTasks: number;
}

export interface CompletionBreakdown {
  completed: number;
  pending: number;
}

export interface DashboardOverviewResult {
  projectProgress: ProjectProgress[];
  taskStats: TaskStats;
  upcomingDeadlines: Task[];
  completionBreakdown: CompletionBreakdown;
  teamPerformance?: TeamMemberPerformance[];
}
