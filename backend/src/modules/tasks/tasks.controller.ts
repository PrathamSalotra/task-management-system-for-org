import { Request, Response } from 'express';
import { createTaskSchema } from './tasks.schema';
import {
  createTask,
  TaskNotFoundError,
  TaskForbiddenError,
  AssigneeNotMemberError,
} from './tasks.service';
import { ProjectNotFoundError } from '../projects/projects.service';

export async function createTaskHandler(
  req: Request,
  res: Response
): Promise<void> {
  const validationResult = createTaskSchema.safeParse(req.body);

  if (!validationResult.success) {
    res.status(400).json({
      error: 'Validation error',
      details: validationResult.error.issues,
    });
    return;
  }

  if (!req.user || !req.user.id || !req.user.role) {
    res.status(401).json({
      error: 'Authentication required',
    });
    return;
  }

  const projectId = req.params.id || validationResult.data.projectId;
  if (!projectId) {
    res.status(400).json({
      error: 'Project ID is required',
    });
    return;
  }

  try {
    const task = await createTask(
      {
        ...validationResult.data,
        projectId,
      },
      {
        id: req.user.id,
        role: req.user.role,
      }
    );
    res.status(201).json(task);
  } catch (err: any) {
    if (
      err instanceof ProjectNotFoundError ||
      err instanceof TaskNotFoundError
    ) {
      res.status(404).json({
        error: err.message,
      });
      return;
    }
    if (err instanceof TaskForbiddenError) {
      res.status(403).json({
        error: err.message,
      });
      return;
    }
    if (
      err instanceof AssigneeNotMemberError ||
      (err.message && err.message.includes('Assignee is not a member'))
    ) {
      res.status(400).json({
        error: err.message,
      });
      return;
    }

    console.error('Error in createTaskHandler:', err);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
}
