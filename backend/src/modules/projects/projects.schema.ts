import { z } from 'zod';

export const createProjectSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Project name is required')
      .max(150, 'Project name is too long'),
    description: z.string().optional(),
    startDate: z
      .string()
      .min(1, 'Start date is required')
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid start date format',
      }),
    deadline: z
      .string()
      .min(1, 'Deadline is required')
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid deadline format',
      }),
  })
  .refine((data) => new Date(data.deadline) >= new Date(data.startDate), {
    message: 'Deadline cannot be earlier than start date',
    path: ['deadline'],
  });

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
