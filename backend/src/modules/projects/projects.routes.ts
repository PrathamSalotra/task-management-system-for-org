import { Router } from 'express';
import {
  createProjectHandler,
  updateProjectHandler,
  deleteProjectHandler,
  addProjectMemberHandler,
  removeProjectMemberHandler,
  getProjectsHandler,
  getProjectByIdHandler,
} from './projects.controller';
import { authenticateJWT } from '../../middleware/auth.middleware';
import { rbacGuard } from '../../middleware/rbac.middleware';
import {
  createTaskHandler,
  listTasksHandler,
} from '../tasks/tasks.controller';

const router = Router();

router.use(authenticateJWT, rbacGuard);

router.post('/', createProjectHandler);
router.get('/', getProjectsHandler);
router.get('/:id', getProjectByIdHandler);
router.put('/:id', updateProjectHandler);
router.delete('/:id', deleteProjectHandler);

router.post('/:id/members', addProjectMemberHandler);
router.delete('/:id/members/:userId', removeProjectMemberHandler);

router.post('/:id/tasks', createTaskHandler);
router.get('/:id/tasks', listTasksHandler);

export default router;
