import { Request, Response } from 'express';
import { updateRoleSchema } from './users.schema';
import { listUsers, updateUserRole, UserNotFoundError } from './users.service';

export async function getUsers(_req: Request, res: Response): Promise<void> {
  try {
    const users = await listUsers();
    res.status(200).json(users);
  } catch (err: any) {
    console.error('Error in listUsers:', err);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
}

export async function updateRole(req: Request, res: Response): Promise<void> {
  const validationResult = updateRoleSchema.safeParse(req.body);

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
    const updatedUser = await updateUserRole(
      req.params.id,
      validationResult.data.role,
      req.user.id
    );

    res.status(200).json(updatedUser);
  } catch (err: any) {
    if (err instanceof UserNotFoundError) {
      res.status(404).json({
        error: err.message,
      });
      return;
    }

    console.error('Error in updateUserRole:', err);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
}
