import { prisma } from '../../prisma/client';
import { Role } from '../../generated/prisma/client';

export class UserNotFoundError extends Error {
  constructor(message = 'User not found') {
    super(message);
    this.name = 'UserNotFoundError';
  }
}

const USER_PUBLIC_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
};

export async function listUsers() {
  const users = await prisma.user.findMany({
    select: USER_PUBLIC_SELECT,
    orderBy: { createdAt: 'desc' },
  });

  return users;
}

export async function updateUserRole(
  targetUserId: string,
  newRole: Role,
  adminUserId: string
) {
  const existingUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, role: true },
  });

  if (!existingUser) {
    throw new UserNotFoundError();
  }

  const [updatedUser] = await prisma.$transaction([
    prisma.user.update({
      where: { id: targetUserId },
      data: { role: newRole },
      select: USER_PUBLIC_SELECT,
    }),
    prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: 'UPDATE_ROLE',
        entityType: 'USER',
        entityId: targetUserId,
        metadata: {
          oldRole: existingUser.role,
          newRole,
        },
      },
    }),
  ]);

  return updatedUser;
}
