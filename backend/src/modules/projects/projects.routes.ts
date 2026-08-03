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

/**
 * @openapi
 * /api/v1/projects:
 *   post:
 *     summary: Create a new project (Admin or Project Manager only)
 *     tags: [Projects]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [PLANNED, ACTIVE, COMPLETED, ARCHIVED]
 *     responses:
 *       201:
 *         description: Project created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       403:
 *         description: Forbidden
 *   get:
 *     summary: List projects accessible to the authenticated user
 *     tags: [Projects]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter projects by status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by project name or description
 *     responses:
 *       200:
 *         description: Array of projects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Project'
 */
router.post('/', createProjectHandler);
router.get('/', getProjectsHandler);

/**
 * @openapi
 * /api/v1/projects/{id}:
 *   get:
 *     summary: Get details of a project by ID
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project UUID
 *     responses:
 *       200:
 *         description: Project details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       404:
 *         description: Project not found
 *   put:
 *     summary: Update a project by ID (Admin or Project Manager only)
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [PLANNED, ACTIVE, COMPLETED, ARCHIVED]
 *     responses:
 *       200:
 *         description: Project updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       403:
 *         description: Forbidden
 *   delete:
 *     summary: Permanently delete a project by ID (Admin or Project Manager only)
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project UUID
 *     responses:
 *       200:
 *         description: Project deleted successfully
 *       403:
 *         description: Forbidden
 */
router.get('/:id', getProjectByIdHandler);
router.put('/:id', updateProjectHandler);
router.delete('/:id', deleteProjectHandler);

/**
 * @openapi
 * /api/v1/projects/{id}/members:
 *   post:
 *     summary: Add a team member to a project
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId]
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Member added successfully
 *       403:
 *         description: Forbidden
 */
router.post('/:id/members', addProjectMemberHandler);

/**
 * @openapi
 * /api/v1/projects/{id}/members/{userId}:
 *   delete:
 *     summary: Remove a team member from a project
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project UUID
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User UUID to remove
 *     responses:
 *       200:
 *         description: Member removed successfully
 *       403:
 *         description: Forbidden
 */
router.delete('/:id/members/:userId', removeProjectMemberHandler);

/**
 * @openapi
 * /api/v1/projects/{id}/tasks:
 *   post:
 *     summary: Create a new task within a project
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [TODO, IN_PROGRESS, IN_REVIEW, DONE]
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, URGENT]
 *               assigneeId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Task created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *   get:
 *     summary: List all tasks in a project
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project UUID
 *     responses:
 *       200:
 *         description: Array of tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Task'
 */
router.post('/:id/tasks', createTaskHandler);
router.get('/:id/tasks', listTasksHandler);

export default router;
