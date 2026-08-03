import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  registerUser,
  loginUser,
  refreshUser,
  logoutUser,
  DuplicateEmailError,
  InvalidCredentialsError,
  InvalidRefreshTokenError,
} from './auth.service';
import { prisma } from '../../prisma/client';
import { Role } from '../../generated/prisma/client';

jest.mock('../../prisma/client', () => {
  return {
    prisma: {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    },
  };
});

const mockedPrisma = prisma as unknown as {
  user: {
    findUnique: jest.Mock;
    create: jest.Mock;
  };
};

describe('Auth Service Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should successfully register a user, hash the password, and return user without passwordHash', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue(null);
      mockedPrisma.user.create.mockImplementation(async ({ data }: any) => ({
        id: 'user-1',
        name: data.name,
        email: data.email,
        passwordHash: data.passwordHash,
        role: data.role,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const input = {
        name: 'Alice',
        email: 'alice@example.com',
        password: 'Password123!',
      };

      const result = await registerUser(input);

      expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: input.email },
      });
      expect(mockedPrisma.user.create).toHaveBeenCalledTimes(1);

      // Check password hashing
      const createdArg = mockedPrisma.user.create.mock.calls[0][0];
      expect(createdArg.data.passwordHash).not.toBe(input.password);
      const isHashValid = await bcrypt.compare(
        input.password,
        createdArg.data.passwordHash
      );
      expect(isHashValid).toBe(true);
      expect(createdArg.data.role).toBe(Role.TEAM_MEMBER);

      expect(result).not.toHaveProperty('passwordHash');
      expect(result.email).toBe(input.email);
    });

    it('should throw DuplicateEmailError if user already exists', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue({
        id: 'existing-1',
        email: 'alice@example.com',
      });

      const input = {
        name: 'Alice',
        email: 'alice@example.com',
        password: 'Password123!',
      };

      await expect(registerUser(input)).rejects.toThrow(DuplicateEmailError);
      expect(mockedPrisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('loginUser', () => {
    it('should successfully login and return access and refresh tokens', async () => {
      const passwordHash = await bcrypt.hash('Password123!', 10);
      mockedPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        name: 'Alice',
        email: 'alice@example.com',
        passwordHash,
        role: Role.TEAM_MEMBER,
      });

      const result = await loginUser({
        email: 'alice@example.com',
        password: 'Password123!',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result.user.email).toBe('alice@example.com');
    });

    it('should throw InvalidCredentialsError if user not found', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        loginUser({ email: 'unknown@example.com', password: 'Password123!' })
      ).rejects.toThrow(InvalidCredentialsError);
    });

    it('should throw InvalidCredentialsError if password does not match', async () => {
      const passwordHash = await bcrypt.hash('RightPassword!', 10);
      mockedPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        name: 'Alice',
        email: 'alice@example.com',
        passwordHash,
        role: Role.TEAM_MEMBER,
      });

      await expect(
        loginUser({ email: 'alice@example.com', password: 'WrongPassword!' })
      ).rejects.toThrow(InvalidCredentialsError);
    });
  });

  describe('refreshUser and logoutUser', () => {
    it('should refresh user tokens for a valid refresh token', async () => {
      const passwordHash = await bcrypt.hash('Password123!', 10);
      mockedPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        name: 'Alice',
        email: 'alice@example.com',
        passwordHash,
        role: Role.TEAM_MEMBER,
      });

      const loginResult = await loginUser({
        email: 'alice@example.com',
        password: 'Password123!',
      });

      const refreshResult = await refreshUser({
        refreshToken: loginResult.refreshToken,
      });

      expect(refreshResult).toHaveProperty('accessToken');
      expect(refreshResult).toHaveProperty('refreshToken');
    });

    it('should throw InvalidRefreshTokenError after logoutUser blacklists the token', async () => {
      const passwordHash = await bcrypt.hash('Password123!', 10);
      mockedPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        name: 'Alice',
        email: 'alice@example.com',
        passwordHash,
        role: Role.TEAM_MEMBER,
      });

      const loginResult = await loginUser({
        email: 'alice@example.com',
        password: 'Password123!',
      });

      await logoutUser({ refreshToken: loginResult.refreshToken });

      await expect(
        refreshUser({ refreshToken: loginResult.refreshToken })
      ).rejects.toThrow(InvalidRefreshTokenError);
    });
  });
});
