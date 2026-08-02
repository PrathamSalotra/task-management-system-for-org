import { Router } from 'express';
import {
  createTaskHandler,
  listTasksHandler,
  updateTaskHandler,
  deleteTaskHandler,
} from './tasks.controller';
import { authenticateJWT } from '../../middleware/auth.middleware';
import { rbacGuard } from '../../middleware/rbac.middleware';

const router = Router();

router.use(authenticateJWT, rbacGuard);

router.post('/', createTaskHandler);
router.get('/', listTasksHandler);
router.put('/:id', updateTaskHandler);
router.delete('/:id', deleteTaskHandler);

export default router;
