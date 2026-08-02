import { z } from 'zod';
import { TaskPriority, TaskStatus } from '../../generated/prisma/client';

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const createTaskSchema = z.object({
  projectId: z
    .string()
    .refine((val) => uuidRegex.test(val), {
      message: 'Invalid project ID format',
    })
    .optional(),
  title: z
    .string()
    .min(1, 'Task title is required')
    .max(200, 'Task title is too long'),
  description: z.string().optional().nullable(),
  priority: z
    .enum([TaskPriority.LOW, TaskPriority.MEDIUM, TaskPriority.HIGH], {
      message: 'Invalid task priority',
    })
    .optional(),
  assigneeId: z
    .string()
    .refine((val) => !val || uuidRegex.test(val), {
      message: 'Invalid assignee ID format',
    })
    .optional()
    .nullable(),
  dueDate: z
    .string()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'Invalid due date format',
    })
    .optional()
    .nullable(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Task title cannot be empty')
    .max(200, 'Task title is too long')
    .optional(),
  description: z.string().optional().nullable(),
  priority: z
    .enum([TaskPriority.LOW, TaskPriority.MEDIUM, TaskPriority.HIGH], {
      message: 'Invalid task priority',
    })
    .optional(),
  status: z
    .enum([TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED], {
      message: 'Invalid task status',
    })
    .optional(),
  assigneeId: z
    .string()
    .refine((val) => !val || uuidRegex.test(val), {
      message: 'Invalid assignee ID format',
    })
    .optional()
    .nullable(),
  assignee_id: z
    .string()
    .refine((val) => !val || uuidRegex.test(val), {
      message: 'Invalid assignee ID format',
    })
    .optional()
    .nullable(),
  dueDate: z
    .string()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'Invalid due date format',
    })
    .optional()
    .nullable(),
  due_date: z
    .string()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'Invalid due date format',
    })
    .optional()
    .nullable(),
});

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export const createCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Comment content cannot be empty')
    .max(5000, 'Comment content is too long'),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
