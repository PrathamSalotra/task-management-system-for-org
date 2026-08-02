import { Router } from 'express';
import {
  createProjectHandler,
  updateProjectHandler,
  deleteProjectHandler,
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
router.put('/:id', updateProjectHandler);
router.delete('/:id', deleteProjectHandler);

export default router;
