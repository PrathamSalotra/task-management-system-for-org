import { Request, Response, NextFunction } from 'express';
import { Role } from '../generated/prisma/client';

export interface PermissionRule {
  method: string; // HTTP method like 'GET', 'POST', 'PUT', 'DELETE', or '*'
  path: RegExp | string;
  allowedRoles: string[];
}

export const permissionRules: PermissionRule[] = [
  // Admin User & Role Management (Step 2.6)
  {
    method: 'GET',
    path: /^\/api\/v1\/users(?:\/.*)?$/,
    allowedRoles: [Role.ADMIN, Role.PROJECT_MANAGER, Role.TEAM_MEMBER],
  },
  {
    method: 'PUT',
    path: /^\/api\/v1\/users(?:\/.*)?$/,
    allowedRoles: [Role.ADMIN],
  },
  // Project creation/update/delete (PM & Admin)
  {
    method: 'POST',
    path: /^\/api\/v1\/projects(?:\/.*)?$/,
    allowedRoles: [Role.ADMIN, Role.PROJECT_MANAGER],
  },
  {
    method: 'PUT',
    path: /^\/api\/v1\/projects(?:\/.*)?$/,
    allowedRoles: [Role.ADMIN, Role.PROJECT_MANAGER],
  },
  {
    method: 'DELETE',
    path: /^\/api\/v1\/projects(?:\/.*)?$/,
    allowedRoles: [Role.ADMIN, Role.PROJECT_MANAGER],
  },
  // Project viewing (All authenticated roles)
  {
    method: 'GET',
    path: /^\/api\/v1\/projects(?:\/.*)?$/,
    allowedRoles: [Role.ADMIN, Role.PROJECT_MANAGER, Role.TEAM_MEMBER],
  },
  // Tasks (All authenticated roles)
  {
    method: '*',
    path: /^\/api\/v1\/tasks(?:\/.*)?$/,
    allowedRoles: [Role.ADMIN, Role.PROJECT_MANAGER, Role.TEAM_MEMBER],
  },
  // Dashboard (All authenticated roles)
  {
    method: 'GET',
    path: /^\/api\/v1\/dashboard\/overview$/,
    allowedRoles: [Role.ADMIN, Role.PROJECT_MANAGER, Role.TEAM_MEMBER],
  },
  // Temporary test routes for verification
  {
    method: 'GET',
    path: '/test-auth',
    allowedRoles: [Role.PROJECT_MANAGER],
  },
  {
    method: 'GET',
    path: '/test-rbac',
    allowedRoles: [Role.PROJECT_MANAGER],
  },
];

function matchPath(rulePath: string | RegExp, actualPath: string): boolean {
  if (rulePath instanceof RegExp) {
    return rulePath.test(actualPath);
  }
  return actualPath === rulePath || actualPath.startsWith(rulePath + '/');
}

export function rbacGuard(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user || !req.user.role) {
    res.status(401).json({
      error: 'Authentication required',
    });
    return;
  }

  const pathToCheck = (req.originalUrl || req.path).split('?')[0];
  const methodToCheck = req.method.toUpperCase();

  const matchingRule = permissionRules.find((rule) => {
    const methodMatches =
      rule.method === '*' || rule.method.toUpperCase() === methodToCheck;
    return methodMatches && matchPath(rule.path, pathToCheck);
  });

  if (matchingRule) {
    if (!matchingRule.allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Forbidden: Insufficient permissions',
      });
      return;
    }
  }

  next();
}
