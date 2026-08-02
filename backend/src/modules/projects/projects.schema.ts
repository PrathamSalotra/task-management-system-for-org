import { z } from 'zod';
import { ProjectStatus } from '../../generated/prisma/client';

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

export const updateProjectSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Project name is required')
      .max(150, 'Project name is too long')
      .optional(),
    description: z.string().optional(),
    startDate: z
      .string()
      .min(1, 'Start date is required')
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid start date format',
      })
      .optional(),
    deadline: z
      .string()
      .min(1, 'Deadline is required')
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid deadline format',
      })
      .optional(),
    status: z
      .enum(
        [
          ProjectStatus.ACTIVE,
          ProjectStatus.ARCHIVED,
          ProjectStatus.COMPLETED,
        ],
        {
          message: 'Invalid project status',
        }
      )
      .optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.deadline) {
        return new Date(data.deadline) >= new Date(data.startDate);
      }
      return true;
    },
    {
      message: 'Deadline cannot be earlier than start date',
      path: ['deadline'],
    }
  );

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

export const addProjectMemberSchema = z.object({
  userId: z
    .string()
    .min(1, 'User ID is required')
    .refine(
      (val) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          val
        ),
      {
        message: 'Invalid user ID format',
      }
    ),
});

export type AddProjectMemberInput = z.infer<typeof addProjectMemberSchema>;
