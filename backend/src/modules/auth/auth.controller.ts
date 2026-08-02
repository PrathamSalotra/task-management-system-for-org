import { Request, Response } from 'express';
import { registerSchema } from './auth.schema';
import { registerUser, DuplicateEmailError } from './auth.service';

export async function register(req: Request, res: Response): Promise<void> {
  const validationResult = registerSchema.safeParse(req.body);

  if (!validationResult.success) {
    res.status(400).json({
      error: 'Validation error',
      details: validationResult.error.issues,
    });
    return;
  }

  try {
    const user = await registerUser(validationResult.data);
    res.status(201).json(user);
  } catch (err: any) {
    if (err instanceof DuplicateEmailError) {
      res.status(409).json({
        error: err.message,
      });
      return;
    }

    console.error('Error in user registration:', err);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
}
