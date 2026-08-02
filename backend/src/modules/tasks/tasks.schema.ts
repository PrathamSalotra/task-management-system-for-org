import { z } from 'zod';
import { TaskPriority } from '../../generated/prisma/client';

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
