import { Router } from 'express';
import { auditController } from './audit.controller';
import { authenticateJWT } from '../../middleware/auth.middleware';
import { rbacGuard } from '../../middleware/rbac.middleware';

const router = Router();

// Only ADMINs can view audit logs (enforced by rbacGuard and permissionRules)
router.get(
  '/',
  authenticateJWT,
  rbacGuard,
  auditController.getAuditLogs.bind(auditController)
);

export default router;
