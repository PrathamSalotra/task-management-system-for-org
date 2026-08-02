import { Router } from 'express';
import { getOverviewHandler } from './dashboard.controller';
import { authenticateJWT } from '../../middleware/auth.middleware';
import { rbacGuard } from '../../middleware/rbac.middleware';

const router = Router();

router.use(authenticateJWT, rbacGuard);

router.get('/overview', getOverviewHandler);

export default router;
