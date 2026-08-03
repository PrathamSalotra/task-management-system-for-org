import { Request, Response, NextFunction } from 'express';
import { rbacGuard } from './rbac.middleware';
import { Role } from '../generated/prisma/client';

describe('RBAC Permission Evaluation Unit Tests', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };
    nextFunction = jest.fn();
  });

  describe('Unauthenticated requests', () => {
    it('should return 401 if req.user is undefined', () => {
      mockRequest = {
        method: 'GET',
        originalUrl: '/api/v1/projects',
      };

      rbacGuard(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Authentication required',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 if req.user is present but missing role', () => {
      mockRequest = {
        method: 'GET',
        originalUrl: '/api/v1/projects',
        user: {} as any,
      };

      rbacGuard(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('Project Routes Permission Evaluation', () => {
    it('should allow GET /api/v1/projects for TEAM_MEMBER, PROJECT_MANAGER, and ADMIN', () => {
      const roles = [Role.TEAM_MEMBER, Role.PROJECT_MANAGER, Role.ADMIN];

      roles.forEach((role) => {
        const nextFn = jest.fn();
        mockRequest = {
          method: 'GET',
          originalUrl: '/api/v1/projects',
          user: { id: 'u1', role },
        };

        rbacGuard(mockRequest as Request, mockResponse as Response, nextFn);
        expect(nextFn).toHaveBeenCalledTimes(1);
      });
    });

    it('should allow POST /api/v1/projects for PROJECT_MANAGER and ADMIN', () => {
      const allowedRoles = [Role.PROJECT_MANAGER, Role.ADMIN];

      allowedRoles.forEach((role) => {
        const nextFn = jest.fn();
        mockRequest = {
          method: 'POST',
          originalUrl: '/api/v1/projects',
          user: { id: 'u1', role },
        };

        rbacGuard(mockRequest as Request, mockResponse as Response, nextFn);
        expect(nextFn).toHaveBeenCalledTimes(1);
      });
    });

    it('should block POST /api/v1/projects for TEAM_MEMBER with 403 Forbidden', () => {
      mockRequest = {
        method: 'POST',
        originalUrl: '/api/v1/projects',
        user: { id: 'u1', role: Role.TEAM_MEMBER },
      };

      rbacGuard(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Forbidden: Insufficient permissions',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should block DELETE /api/v1/projects/123 for TEAM_MEMBER', () => {
      mockRequest = {
        method: 'DELETE',
        originalUrl: '/api/v1/projects/123-abc',
        user: { id: 'u1', role: Role.TEAM_MEMBER },
      };

      rbacGuard(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should allow DELETE /api/v1/projects/123 for PROJECT_MANAGER and ADMIN', () => {
      [Role.PROJECT_MANAGER, Role.ADMIN].forEach((role) => {
        const nextFn = jest.fn();
        mockRequest = {
          method: 'DELETE',
          originalUrl: '/api/v1/projects/123-abc',
          user: { id: 'u1', role },
        };

        rbacGuard(mockRequest as Request, mockResponse as Response, nextFn);
        expect(nextFn).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('User Management Routes Permission Evaluation', () => {
    it('should allow GET /api/v1/users for all roles', () => {
      [Role.TEAM_MEMBER, Role.PROJECT_MANAGER, Role.ADMIN].forEach((role) => {
        const nextFn = jest.fn();
        mockRequest = {
          method: 'GET',
          originalUrl: '/api/v1/users',
          user: { id: 'u1', role },
        };

        rbacGuard(mockRequest as Request, mockResponse as Response, nextFn);
        expect(nextFn).toHaveBeenCalledTimes(1);
      });
    });

    it('should block PUT /api/v1/users for TEAM_MEMBER and PROJECT_MANAGER with 403 Forbidden', () => {
      [Role.TEAM_MEMBER, Role.PROJECT_MANAGER].forEach((role) => {
        statusMock.mockClear();
        jsonMock.mockClear();
        const nextFn = jest.fn();

        mockRequest = {
          method: 'PUT',
          originalUrl: '/api/v1/users/u123',
          user: { id: 'u1', role },
        };

        rbacGuard(mockRequest as Request, mockResponse as Response, nextFn);
        expect(statusMock).toHaveBeenCalledWith(403);
        expect(nextFn).not.toHaveBeenCalled();
      });
    });

    it('should allow PUT /api/v1/users for ADMIN', () => {
      mockRequest = {
        method: 'PUT',
        originalUrl: '/api/v1/users/u123',
        user: { id: 'admin1', role: Role.ADMIN },
      };

      rbacGuard(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalledTimes(1);
    });
  });

  describe('Wildcard Method Evaluation (*)', () => {
    it('should allow any HTTP method on /api/v1/tasks for all authenticated roles', () => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
      const roles = [Role.TEAM_MEMBER, Role.PROJECT_MANAGER, Role.ADMIN];

      methods.forEach((method) => {
        roles.forEach((role) => {
          const nextFn = jest.fn();
          mockRequest = {
            method,
            originalUrl: '/api/v1/tasks/task-101',
            user: { id: 'u1', role },
          };

          rbacGuard(mockRequest as Request, mockResponse as Response, nextFn);
          expect(nextFn).toHaveBeenCalledTimes(1);
        });
      });
    });
  });
});
