import { Router } from 'express';
import {
  getOverviewHandler,
  getTeamPerformanceHandler,
} from './dashboard.controller';
import { authenticateJWT } from '../../middleware/auth.middleware';
import { rbacGuard } from '../../middleware/rbac.middleware';

const router = Router();

router.use(authenticateJWT, rbacGuard);

/**
 * @openapi
 * /api/v1/dashboard/overview:
 *   get:
 *     summary: Get overview metrics across projects and tasks
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Overview metrics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalProjects:
 *                   type: number
 *                 totalTasks:
 *                   type: number
 *                 activeTasks:
 *                   type: number
 *                 completedTasks:
 *                   type: number
 */
router.get('/overview', getOverviewHandler);

/**
 * @openapi
 * /api/v1/dashboard/team-performance:
 *   get:
 *     summary: Get team performance analytics (Admin or PM only)
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Array of member performance statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   userId:
 *                     type: string
 *                   name:
 *                     type: string
 *                   assignedTasks:
 *                     type: number
 *                   completedTasks:
 *                     type: number
 *       403:
 *         description: Forbidden (PM/Admin only)
 */
router.get('/team-performance', getTeamPerformanceHandler);

export default router;
