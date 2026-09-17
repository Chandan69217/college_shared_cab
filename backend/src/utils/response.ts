import { Response } from 'express';
import { ApiResponse } from '../types';

export function sendSuccess<T>(
  res: Response,
  message: string,
  data: T | null = null,
  statusCode = 200
): Response {
  const responsePayload: ApiResponse<T> = {
    success: true,
    message,
    data,
    error: null,
  };
  return res.status(statusCode).json(responsePayload);
}

export function sendError(
  res: Response,
  message: string,
  code = 'INTERNAL_ERROR',
  details: any = null,
  statusCode = 500
): Response {
  const responsePayload: ApiResponse = {
    success: false,
    message,
    data: null,
    error: {
      code,
      message,
      details,
    },
  };
  return res.status(statusCode).json(responsePayload);
}
