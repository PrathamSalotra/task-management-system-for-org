import { Request, Response } from 'express';
import {
  getDashboardOverview,
  getTeamPerformance,
  DashboardForbiddenError,
} from './dashboard.service';

export async function getOverviewHandler(
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
    const overview = await getDashboardOverview({
      id: req.user.id,
      role: req.user.role,
    });

    res.status(200).json(overview);
  } catch (err: any) {
    console.error('Error in getOverviewHandler:', err);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
}

export async function getTeamPerformanceHandler(
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
    const teamPerformance = await getTeamPerformance({
      id: req.user.id,
      role: req.user.role,
    });

    res.status(200).json(teamPerformance);
  } catch (err: any) {
    if (err instanceof DashboardForbiddenError) {
      res.status(403).json({
        error: err.message,
      });
      return;
    }

    console.error('Error in getTeamPerformanceHandler:', err);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
}
