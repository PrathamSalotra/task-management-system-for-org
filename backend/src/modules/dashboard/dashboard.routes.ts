import { Router } from 'express';
import {
  getOverviewHandler,
  getTeamPerformanceHandler,
} from './dashboard.controller';
import { authenticateJWT } from '../../middleware/auth.middleware';
import { rbacGuard } from '../../middleware/rbac.middleware';

const router = Router();

router.use(authenticateJWT, rbacGuard);

router.get('/overview', getOverviewHandler);
router.get('/team-performance', getTeamPerformanceHandler);

export default router;
