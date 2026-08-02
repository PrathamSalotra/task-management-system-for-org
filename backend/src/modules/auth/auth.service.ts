import bcrypt from 'bcryptjs';
import { prisma } from '../../prisma/client';
import { Role } from '../../generated/prisma/client';
import { RegisterInput } from './auth.schema';

export class DuplicateEmailError extends Error {
  constructor(message = 'User with this email already exists') {
    super(message);
    this.name = 'DuplicateEmailError';
  }
}

export async function registerUser(input: RegisterInput) {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existingUser) {
    throw new DuplicateEmailError();
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      role: Role.TEAM_MEMBER,
    },
  });

  // Return created user without password hash
  const { passwordHash: _excluded, ...userWithoutPassword } = user;
  return userWithoutPassword;
}
