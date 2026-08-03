import { Router } from 'express';
import {
  createTaskHandler,
  listTasksHandler,
  updateTaskHandler,
  deleteTaskHandler,
  addCommentHandler,
  listCommentsHandler,
  addAttachmentHandler,
  listAttachmentsHandler,
} from './tasks.controller';
import { authenticateJWT } from '../../middleware/auth.middleware';
import { rbacGuard } from '../../middleware/rbac.middleware';
import { handleAttachmentUpload } from '../../middleware/upload.middleware';

const router = Router();

router.use(authenticateJWT, rbacGuard);

/**
 * @openapi
 * /api/v1/tasks:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, projectId]
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
 *               projectId:
 *                 type: string
 *                 format: uuid
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
 *     summary: Get all tasks across accessible projects
 *     tags: [Tasks]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter tasks by status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *         description: Filter tasks by priority
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
router.post('/', createTaskHandler);
router.get('/', listTasksHandler);

/**
 * @openapi
 * /api/v1/tasks/{id}:
 *   put:
 *     summary: Update a task by ID (status, assignee, or details)
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
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
 *       200:
 *         description: Task updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       403:
 *         description: Forbidden (only Assignee, PM, or Admin can change status)
 *   delete:
 *     summary: Permanently delete a task by ID (PM or Admin only)
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task UUID
 *     responses:
 *       200:
 *         description: Task deleted successfully
 *       403:
 *         description: Forbidden
 */
router.put('/:id', updateTaskHandler);
router.delete('/:id', deleteTaskHandler);

/**
 * @openapi
 * /api/v1/tasks/{id}/comments:
 *   post:
 *     summary: Add a comment to a task
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Comment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *   get:
 *     summary: List all comments on a task
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task UUID
 *     responses:
 *       200:
 *         description: Array of comments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
 */
router.post('/:id/comments', addCommentHandler);
router.get('/:id/comments', listCommentsHandler);

/**
 * @openapi
 * /api/v1/tasks/{id}/attachments:
 *   post:
 *     summary: Upload an attachment for a task
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task UUID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Attachment uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Attachment'
 *   get:
 *     summary: List all attachments for a task
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task UUID
 *     responses:
 *       200:
 *         description: Array of attachments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Attachment'
 */
router.post('/:id/attachments', handleAttachmentUpload, addAttachmentHandler);
router.get('/:id/attachments', listAttachmentsHandler);

export default router;
