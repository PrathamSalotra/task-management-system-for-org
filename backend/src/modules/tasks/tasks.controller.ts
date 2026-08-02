import { Request, Response } from 'express';
import { createTaskSchema, updateTaskSchema } from './tasks.schema';
import {
  createTask,
  listTasks,
  updateTask,
  TaskNotFoundError,
  TaskForbiddenError,
  AssigneeNotMemberError,
} from './tasks.service';
import {
  ProjectNotFoundError,
  ProjectForbiddenError,
} from '../projects/projects.service';

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

export async function listTasksHandler(
  req: Request,
  res: Response
): Promise<void> {
  if (!req.user || !req.user.id || !req.user.role) {
    res.status(401).json({
      error: 'Authentication required',
    });
    return;
  }

  const projectId =
    req.params.id ||
    (req.query.projectId as string) ||
    (req.query.project_id as string);
  if (!projectId) {
    res.status(400).json({
      error: 'Project ID is required',
    });
    return;
  }

  try {
    const result = await listTasks(
      projectId,
      {
        id: req.user.id,
        role: req.user.role,
      },
      req.query as any
    );
    res.status(200).json(result);
  } catch (err: any) {
    if (err instanceof ProjectNotFoundError) {
      res.status(404).json({
        error: err.message || 'Project not found',
      });
      return;
    }
    if (err instanceof ProjectForbiddenError) {
      res.status(403).json({
        error: err.message || 'Forbidden',
      });
      return;
    }

    console.error('Error in listTasksHandler:', err);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
}

export async function updateTaskHandler(
  req: Request,
  res: Response
): Promise<void> {
  const validationResult = updateTaskSchema.safeParse(req.body);
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

  const taskId = req.params.id;
  if (!taskId) {
    res.status(400).json({
      error: 'Task ID is required',
    });
    return;
  }

  try {
    const updatedTask = await updateTask(
      taskId,
      validationResult.data,
      {
        id: req.user.id,
        role: req.user.role,
      }
    );
    res.status(200).json(updatedTask);
  } catch (err: any) {
    if (err instanceof TaskNotFoundError) {
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

    console.error('Error in updateTaskHandler:', err);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
}
