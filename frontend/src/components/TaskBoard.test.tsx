import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TaskBoard } from './TaskBoard';
import { Project, Task } from '../lib/api/types';

const mockUpdateTaskMutateAsync = jest.fn();
const mockCreateTaskMutateAsync = jest.fn();
const mockDeleteTaskMutateAsync = jest.fn();

let mockCurrentUser: any = {
  id: 'tm-1',
  name: 'Bob Member',
  email: 'bob@example.com',
  role: 'TEAM_MEMBER',
};

jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockCurrentUser,
    isAuthenticated: true,
  }),
}));

jest.mock('../hooks/useTasks', () => ({
  useProjectTasks: () => ({
    data: {
      data: [
        {
          id: 'task-101',
          title: 'Fix UI Bugs',
          description: 'Fixing layout issues',
          status: 'TODO',
          priority: 'HIGH',
          projectId: 'proj-1',
          assigneeId: 'tm-1',
          assignee: {
            id: 'tm-1',
            name: 'Bob Member',
            email: 'bob@example.com',
            role: 'TEAM_MEMBER',
          },
          dueDate: '2026-08-15T00:00:00.000Z',
          createdAt: '2026-08-01T00:00:00.000Z',
          updatedAt: '2026-08-01T00:00:00.000Z',
        } as Task,
      ],
      total: 1,
      page: 1,
      pageSize: 100,
    },
    isLoading: false,
    isError: false,
  }),
  useCreateTask: () => ({
    mutateAsync: mockCreateTaskMutateAsync,
    isPending: false,
  }),
  useUpdateProjectTask: () => ({
    mutateAsync: mockUpdateTaskMutateAsync,
    isPending: false,
  }),
  useDeleteTask: () => ({
    mutateAsync: mockDeleteTaskMutateAsync,
    isPending: false,
  }),
}));

const mockProject: Project = {
  id: 'proj-1',
  name: 'Test Project',
  description: 'Test Project Description',
  status: 'ACTIVE',
  startDate: '2026-08-01T00:00:00.000Z',
  deadline: '2026-09-01T00:00:00.000Z',
  managerId: 'pm-1',
  manager: {
    id: 'pm-1',
    name: 'Alice PM',
    email: 'alice@example.com',
    role: 'PROJECT_MANAGER',
  },
  members: [
    {
      id: 'mem-1',
      projectId: 'proj-1',
      userId: 'tm-1',
      user: {
        id: 'tm-1',
        name: 'Bob Member',
        email: 'bob@example.com',
        role: 'TEAM_MEMBER',
      },
      createdAt: '2026-08-01T00:00:00.000Z',
    },
  ],
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
};

describe('TaskBoard Component Status-Change Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser = {
      id: 'tm-1',
      name: 'Bob Member',
      email: 'bob@example.com',
      role: 'TEAM_MEMBER',
    };
  });

  it('renders task cards and allows assigned Team Member to change task status via select dropdown', async () => {
    mockUpdateTaskMutateAsync.mockResolvedValueOnce({});

    render(<TaskBoard project={mockProject} canManageProject={false} />);

    expect(screen.getByText('Fix UI Bugs')).toBeInTheDocument();

    // Find the status select dropdown for the task
    const statusSelects = screen.getAllByRole('combobox');
    expect(statusSelects.length).toBeGreaterThan(0);

    // The task status select defaults to 'TODO'
    const statusSelect = statusSelects.find(
      (select) => (select as HTMLSelectElement).value === 'TODO'
    );
    expect(statusSelect).toBeDefined();

    // Change status from 'TODO' to 'IN_PROGRESS'
    fireEvent.change(statusSelect!, { target: { value: 'IN_PROGRESS' } });

    await waitFor(() => {
      expect(mockUpdateTaskMutateAsync).toHaveBeenCalledWith({
        taskId: 'task-101',
        data: { status: 'IN_PROGRESS' },
      });
      expect(screen.getByText(/Task moved to IN_PROGRESS/i)).toBeInTheDocument();
    });
  });

  it('displays read-only status badge without select dropdown when Team Member is not assigned to the task', () => {
    mockCurrentUser = {
      id: 'other-tm',
      name: 'Other User',
      email: 'other@example.com',
      role: 'TEAM_MEMBER',
    };

    render(<TaskBoard project={mockProject} canManageProject={false} />);

    expect(screen.getByText('Fix UI Bugs')).toBeInTheDocument();

    // Ensure no status select box (with value 'TODO') is rendered for this task since user is not assignee or PM
    const statusSelects = screen.getAllByRole('combobox');
    const taskStatusSelect = statusSelects.find(
      (select) => (select as HTMLSelectElement).value === 'TODO'
    );
    expect(taskStatusSelect).toBeUndefined();

    // Ensure read-only lock indicator is present
    expect(
      screen.getByTitle('Only the assigned member or PM can update status')
    ).toBeInTheDocument();
  });

  it('allows Project Manager to update task status even if not assigned', async () => {
    mockCurrentUser = {
      id: 'pm-1',
      name: 'Alice PM',
      email: 'alice@example.com',
      role: 'PROJECT_MANAGER',
    };
    mockUpdateTaskMutateAsync.mockResolvedValueOnce({});

    render(<TaskBoard project={mockProject} canManageProject={true} />);

    const statusSelects = screen.getAllByRole('combobox');
    const statusSelect = statusSelects.find(
      (select) => (select as HTMLSelectElement).value === 'TODO'
    );
    expect(statusSelect).toBeDefined();

    fireEvent.change(statusSelect!, { target: { value: 'COMPLETED' } });

    await waitFor(() => {
      expect(mockUpdateTaskMutateAsync).toHaveBeenCalledWith({
        taskId: 'task-101',
        data: { status: 'COMPLETED' },
      });
      expect(screen.getByText(/Task moved to COMPLETED/i)).toBeInTheDocument();
    });
  });
});
