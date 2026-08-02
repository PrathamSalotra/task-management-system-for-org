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

router.post('/', createTaskHandler);
router.get('/', listTasksHandler);
router.put('/:id', updateTaskHandler);
router.delete('/:id', deleteTaskHandler);
router.post('/:id/comments', addCommentHandler);
router.get('/:id/comments', listCommentsHandler);
router.post('/:id/attachments', handleAttachmentUpload, addAttachmentHandler);
router.get('/:id/attachments', listAttachmentsHandler);

export default router;
