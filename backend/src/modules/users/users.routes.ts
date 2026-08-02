import { Router } from 'express';
import { getUsers, updateRole } from './users.controller';
import { authenticateJWT } from '../../middleware/auth.middleware';
import { rbacGuard } from '../../middleware/rbac.middleware';

const router = Router();

router.use(authenticateJWT, rbacGuard);

router.get('/', getUsers);
router.put('/:id/role', updateRole);

export default router;
