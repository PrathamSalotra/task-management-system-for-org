import { z } from 'zod';
import { Role } from '../../generated/prisma/client';

export const updateRoleSchema = z.object({
  role: z.enum([Role.ADMIN, Role.PROJECT_MANAGER, Role.TEAM_MEMBER], {
    message: 'Invalid or missing role provided',
  }),
});

export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
