import { Router } from 'express';
import { getUsers, getMe, updateRole } from './users.controller';
import { authenticateJWT } from '../../middleware/auth.middleware';
import { rbacGuard } from '../../middleware/rbac.middleware';

const router = Router();

/**
 * @openapi
 * /api/v1/users/me:
 *   get:
 *     summary: Get profile of currently authenticated user
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Current user profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
router.get('/me', authenticateJWT, getMe);

router.use(authenticateJWT, rbacGuard);

/**
 * @openapi
 * /api/v1/users:
 *   get:
 *     summary: Get list of all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Array of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin/PM only)
 */
router.get('/', getUsers);

/**
 * @openapi
 * /api/v1/users/{id}/role:
 *   put:
 *     summary: Update role of a user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [ADMIN, PROJECT_MANAGER, TEAM_MEMBER]
 *     responses:
 *       200:
 *         description: Role updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
router.put('/:id/role', updateRole);

export default router;
