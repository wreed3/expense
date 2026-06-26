import { Request, Response, NextFunction } from 'express';

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export const pagination = (defaultLimit = 50, maxLimit = 100) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(
      maxLimit,
      Math.max(1, parseInt(req.query.limit as string) || defaultLimit)
    );
    const offset = (page - 1) * limit;

    // Attach pagination params to request
    (req as Request & { pagination: PaginationParams }).pagination = {
      page,
      limit,
      offset,
    };

    next();
  };
};

export const paginatedResponse = (data: any[], total: number, _req: Request, res: Response) => {
  const reqWithPagination = _req as Request & { pagination?: PaginationParams };
  const page = reqWithPagination.pagination?.page || 1;
  const limit = reqWithPagination.pagination?.limit || 50;
  const totalPages = Math.ceil(total / limit);

  res.json({
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  });
};