import { Request, Response } from 'express';
import { createProjectSchema } from './projects.schema';
import {
  createProject,
  listProjects,
  getProjectById,
  ProjectNotFoundError,
  ProjectForbiddenError,
} from './projects.service';

export async function createProjectHandler(
  req: Request,
  res: Response
): Promise<void> {
  const validationResult = createProjectSchema.safeParse(req.body);

  if (!validationResult.success) {
    res.status(400).json({
      error: 'Validation error',
      details: validationResult.error.issues,
    });
    return;
  }

  if (!req.user || !req.user.id) {
    res.status(401).json({
      error: 'Authentication required',
    });
    return;
  }

  try {
    const project = await createProject(validationResult.data, req.user.id);
    res.status(201).json(project);
  } catch (err: any) {
    console.error('Error in createProjectHandler:', err);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
}

export async function getProjectsHandler(
  req: Request,
  res: Response
): Promise<void> {
  if (!req.user || !req.user.id || !req.user.role) {
    res.status(401).json({
      error: 'Authentication required',
    });
    return;
  }

  const includeArchived = req.query.includeArchived === 'true';

  try {
    const projects = await listProjects(
      { id: req.user.id, role: req.user.role },
      includeArchived
    );
    res.status(200).json(projects);
  } catch (err: any) {
    console.error('Error in getProjectsHandler:', err);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
}

export async function getProjectByIdHandler(
  req: Request,
  res: Response
): Promise<void> {
  if (!req.user || !req.user.id || !req.user.role) {
    res.status(401).json({
      error: 'Authentication required',
    });
    return;
  }

  try {
    const project = await getProjectById(req.params.id, {
      id: req.user.id,
      role: req.user.role,
    });
    res.status(200).json(project);
  } catch (err: any) {
    if (err instanceof ProjectNotFoundError) {
      res.status(404).json({
        error: err.message,
      });
      return;
    }
    if (err instanceof ProjectForbiddenError) {
      res.status(403).json({
        error: err.message,
      });
      return;
    }

    console.error('Error in getProjectByIdHandler:', err);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
}
