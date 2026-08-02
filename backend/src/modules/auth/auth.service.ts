import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../prisma/client';
import { Role } from '../../generated/prisma/client';
import { RegisterInput, LoginInput } from './auth.schema';
import { config } from '../../config/env';

export class DuplicateEmailError extends Error {
  constructor(message = 'User with this email already exists') {
    super(message);
    this.name = 'DuplicateEmailError';
  }
}

export class InvalidCredentialsError extends Error {
  constructor(message = 'Invalid email or password') {
    super(message);
    this.name = 'InvalidCredentialsError';
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

  const { passwordHash: _excluded, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    throw new InvalidCredentialsError();
  }

  const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
  if (!isPasswordValid) {
    throw new InvalidCredentialsError();
  }

  const payload = {
    id: user.id,
    role: user.role,
  };

  const accessToken = jwt.sign(payload, config.jwtSecret, {
    expiresIn: '15m',
  });

  const refreshToken = jwt.sign(payload, config.jwtRefreshSecret, {
    expiresIn: '7d',
  });

  const { passwordHash: _excluded, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    accessToken,
    refreshToken,
  };
}
