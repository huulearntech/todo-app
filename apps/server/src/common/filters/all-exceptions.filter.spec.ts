import { AllExceptionsFilter } from './all-exceptions.filter';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import { EntityNotFoundError, QueryFailedError } from 'typeorm';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let mockResponse: {
    status: jest.Mock;
    json: jest.Mock;
    setHeader: jest.Mock;
  };
  let mockRequest: {
    url: string;
    method: string;
    headers: Record<string, string>;
  };
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new AllExceptionsFilter();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn(),
    };

    mockRequest = {
      url: '/api/tasks',
      method: 'POST',
      headers: {},
    };

    mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as unknown as ArgumentsHost;
  });

  it('should handle standard HttpException (e.g. 404 NotFoundException)', () => {
    const exception = new NotFoundException('Task not found');

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Task not found',
        error: 'Not Found',
        path: '/api/tasks',
      }),
    );
    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'x-correlation-id',
      expect.any(String),
    );
  });

  it('should preserve correlation ID from incoming request headers', () => {
    mockRequest.headers['x-correlation-id'] = 'custom-trace-123';
    const exception = new BadRequestException('Validation failed');

    filter.catch(exception, mockHost);

    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'x-correlation-id',
      'custom-trace-123',
    );
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        correlationId: 'custom-trace-123',
      }),
    );
  });

  it('should handle TypeORM unique constraint violation (code 23505)', () => {
    const exception = new QueryFailedError('query', [], new Error('duplicate'));
    (exception as unknown as { driverError: unknown }).driverError = {
      code: '23505',
      detail: 'Key (email)=(test@example.com) already exists.',
    };

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.CONFLICT,
        message: 'email already exists',
        error: 'Conflict',
      }),
    );
  });

  it('should handle TypeORM foreign key constraint violation (code 23503)', () => {
    const exception = new QueryFailedError('query', [], new Error('fk'));
    (exception as unknown as { driverError: unknown }).driverError = {
      code: '23503',
    };

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.CONFLICT,
        error: 'Conflict',
      }),
    );
  });

  it('should handle TypeORM EntityNotFoundError as 404', () => {
    const exception = new EntityNotFoundError('User', { id: '123' });

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Resource not found',
        error: 'Not Found',
      }),
    );
  });

  it('should redact unhandled errors to 500 without leaking stack traces or internal details', () => {
    const exception = new TypeError('Cannot read properties of undefined (reading foo)');

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An internal server error occurred',
        error: 'Internal Server Error',
        path: '/api/tasks',
      }),
    );
  });
});
