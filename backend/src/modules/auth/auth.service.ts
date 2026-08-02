import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../prisma/client';
import { Role } from '../../generated/prisma/client';
import { RegisterInput, LoginInput, RefreshInput, LogoutInput } from './auth.schema';
import { config } from '../../config/env';
import { isTokenBlacklisted, blacklistToken } from './token.store';

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

export class InvalidRefreshTokenError extends Error {
  constructor(message = 'Invalid or expired refresh token') {
    super(message);
    this.name = 'InvalidRefreshTokenError';
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

export async function refreshUser(input: RefreshInput) {
  if (isTokenBlacklisted(input.refreshToken)) {
    throw new InvalidRefreshTokenError();
  }

  let decoded: any;
  try {
    decoded = jwt.verify(input.refreshToken, config.jwtRefreshSecret);
  } catch (err) {
    throw new InvalidRefreshTokenError();
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
  });

  if (!user) {
    throw new InvalidRefreshTokenError();
  }

  blacklistToken(input.refreshToken);

  const payload = {
    id: user.id,
    role: user.role,
  };

  const accessToken = jwt.sign(payload, config.jwtSecret, {
    expiresIn: '15m',
  });

  const newRefreshToken = jwt.sign(payload, config.jwtRefreshSecret, {
    expiresIn: '7d',
  });

  return {
    accessToken,
    refreshToken: newRefreshToken,
  };
}

export async function logoutUser(input: LogoutInput) {
  blacklistToken(input.refreshToken);
  return { message: 'Logged out successfully' };
}
