import { Request, Response } from 'express';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
} from './auth.schema';
import {
  registerUser,
  loginUser,
  refreshUser,
  logoutUser,
  DuplicateEmailError,
  InvalidCredentialsError,
  InvalidRefreshTokenError,
} from './auth.service';

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

export async function login(req: Request, res: Response): Promise<void> {
  const validationResult = loginSchema.safeParse(req.body);

  if (!validationResult.success) {
    res.status(400).json({
      error: 'Validation error',
      details: validationResult.error.issues,
    });
    return;
  }

  try {
    const result = await loginUser(validationResult.data);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json(result);
  } catch (err: any) {
    if (err instanceof InvalidCredentialsError) {
      res.status(401).json({
        error: err.message,
      });
      return;
    }

    console.error('Error in user login:', err);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const payload = {
    refreshToken: req.body?.refreshToken || req.cookies?.refreshToken,
  };
  const validationResult = refreshSchema.safeParse(payload);

  if (!validationResult.success) {
    res.status(400).json({
      error: 'Validation error',
      details: validationResult.error.issues,
    });
    return;
  }

  try {
    const result = await refreshUser(validationResult.data);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json(result);
  } catch (err: any) {
    if (err instanceof InvalidRefreshTokenError) {
      res.status(401).json({
        error: err.message,
      });
      return;
    }

    console.error('Error in user refresh:', err);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  const payload = {
    refreshToken: req.body?.refreshToken || req.cookies?.refreshToken,
  };
  const validationResult = logoutSchema.safeParse(payload);

  if (!validationResult.success) {
    res.status(400).json({
      error: 'Validation error',
      details: validationResult.error.issues,
    });
    return;
  }

  try {
    const result = await logoutUser(validationResult.data);

    res.clearCookie('refreshToken', { path: '/' });

    res.status(200).json(result);
  } catch (err: any) {
    console.error('Error in user logout:', err);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
}
