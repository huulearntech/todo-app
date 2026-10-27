import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { EntityNotFoundError, QueryFailedError } from 'typeorm';
import { randomUUID } from 'crypto';
import type { ApiErrorResponse } from '@todo/shared';

interface PostgresDriverError {
  code?: string;
  detail?: string;
  table?: string;
  constraint?: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Determine or generate correlation ID
    const correlationId =
      (request.headers['x-correlation-id'] as string) ||
      (request.headers['x-request-id'] as string) ||
      randomUUID();

    response.setHeader('x-correlation-id', correlationId);

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'An internal server error occurred';
    let errorName = 'Internal Server Error';
    let details: Record<string, unknown> | undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
        errorName = exception.name;
      } else if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, unknown>;
        if (typeof resObj.message === 'string' || Array.isArray(resObj.message)) {
          message = resObj.message as string | string[];
        } else {
          message = exception.message;
        }
        errorName = (resObj.error as string) || exception.name;
        if (resObj.details && typeof resObj.details === 'object') {
          details = resObj.details as Record<string, unknown>;
        }
      }
    } else if (exception instanceof EntityNotFoundError) {
      statusCode = HttpStatus.NOT_FOUND;
      message = 'Resource not found';
      errorName = 'Not Found';
    } else if (exception instanceof QueryFailedError) {
      const driverError = exception.driverError as
        | PostgresDriverError
        | undefined;
      const code = driverError?.code;

      switch (code) {
        case '23505': {
          statusCode = HttpStatus.CONFLICT;
          errorName = 'Conflict';
          message = 'A record with that value already exists';
          if (driverError?.detail) {
            const match = driverError.detail.match(/Key \((.*?)\)=\((.*?)\)/);
            if (match && match[1]) {
              message = `${match[1]} already exists`;
            }
          }
          break;
        }

        case '23503': {
          statusCode = HttpStatus.CONFLICT;
          errorName = 'Conflict';
          message =
            'Referenced resource cannot be modified or deleted because it is currently in use';
          break;
        }

        case '22P02': {
          statusCode = HttpStatus.BAD_REQUEST;
          errorName = 'Bad Request';
          message = 'Invalid input syntax for parameter or field';
          break;
        }

        default: {
          statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
          errorName = 'Internal Server Error';
          message = 'An internal server error occurred';
          this.logger.error(
            `Unhandled TypeORM QueryFailedError [${correlationId}]: ${exception.message}`,
            exception.stack,
          );
          break;
        }
      }
    } else {
      // Unhandled generic exceptions (e.g., TypeError, unknown Error)
      const err = exception instanceof Error ? exception : new Error(String(exception));
      this.logger.error(
        `Unhandled Exception [${correlationId}] on ${request.method} ${request.url}: ${err.message}`,
        err.stack,
      );
    }

    const errorPayload: ApiErrorResponse = {
      statusCode,
      message,
      error: errorName,
      timestamp: new Date().toISOString(),
      path: request.url,
      correlationId,
      ...(details ? { details } : {}),
    };

    response.status(statusCode).json(errorPayload);
  }
}
