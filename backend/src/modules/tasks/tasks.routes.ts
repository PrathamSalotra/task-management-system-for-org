import { Router } from 'express';
import { createTaskHandler } from './tasks.controller';
import { authenticateJWT } from '../../middleware/auth.middleware';
import { rbacGuard } from '../../middleware/rbac.middleware';

const router = Router();

router.use(authenticateJWT, rbacGuard);

router.post('/', createTaskHandler);

export default router;
