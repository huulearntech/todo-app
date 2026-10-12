import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { EntityNotFoundError, QueryFailedError } from 'typeorm';

interface PostgresDriverError {
  code?: string;
  detail?: string;
  table?: string;
  constraint?: string;
}

@Catch(QueryFailedError, EntityNotFoundError)
export class TypeOrmExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(TypeOrmExceptionFilter.name);

  catch(
    exception: QueryFailedError | EntityNotFoundError,
    host: ArgumentsHost,
  ) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof EntityNotFoundError) {
      return response.status(HttpStatus.NOT_FOUND).json({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Resource not found',
        error: 'Not Found',
      });
    }

    const driverError = exception.driverError as
      PostgresDriverError | undefined;
    const code = driverError?.code;

    switch (code) {
      case '23505': {
        // Unique violation
        let message = 'A record with that value already exists';
        if (driverError?.detail) {
          const match = driverError.detail.match(/Key \((.*?)\)=\((.*?)\)/);
          if (match && match[1]) {
            message = `${match[1]} already exists`;
          }
        }
        return response.status(HttpStatus.CONFLICT).json({
          statusCode: HttpStatus.CONFLICT,
          message,
          error: 'Conflict',
        });
      }

      case '23503': {
        // Foreign key violation
        return response.status(HttpStatus.CONFLICT).json({
          statusCode: HttpStatus.CONFLICT,
          message:
            'Referenced resource cannot be modified or deleted because it is currently in use',
          error: 'Conflict',
        });
      }

      case '22P02': {
        // Invalid text representation (e.g. invalid UUID format)
        return response.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Invalid input syntax for parameter or field',
          error: 'Bad Request',
        });
      }

      default: {
        this.logger.error(
          `Unhandled TypeORM QueryFailedError: ${exception.message}`,
          exception.stack,
        );
        return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'An internal server error occurred',
          error: 'Internal Server Error',
        });
      }
    }
  }
}
