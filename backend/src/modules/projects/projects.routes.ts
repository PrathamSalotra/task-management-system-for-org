import { Router } from 'express';
import {
  createProjectHandler,
  getProjectsHandler,
  getProjectByIdHandler,
} from './projects.controller';
import { authenticateJWT } from '../../middleware/auth.middleware';
import { rbacGuard } from '../../middleware/rbac.middleware';

const router = Router();

router.use(authenticateJWT, rbacGuard);

router.post('/', createProjectHandler);
router.get('/', getProjectsHandler);
router.get('/:id', getProjectByIdHandler);

export default router;
