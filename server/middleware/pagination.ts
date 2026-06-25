import { Request, Response, NextFunction } from 'express';

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export function paginationMiddleware(req: Request, res: Response, next: NextFunction) {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
  const offset = (page - 1) * limit;

  (req as any).pagination = {
    page,
    limit,
    offset,
  } as PaginationParams;

  next();
}

export function createPaginationMeta(
  total: number,
  pagination: PaginationParams
): PaginationMeta {
  const totalPages = Math.ceil(total / pagination.limit);

  return {
    page: pagination.page,
    limit: pagination.limit,
    total,
    totalPages,
    hasNext: pagination.page < totalPages,
    hasPrev: pagination.page > 1,
  };
}