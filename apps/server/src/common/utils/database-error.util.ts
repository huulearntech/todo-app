import { BadRequestException, NotFoundException } from '@nestjs/common';

interface DatabaseError extends Error {
  code?: string;
}

export function handleDatabaseOrderingError(error: unknown): never {
  const dbError = error as DatabaseError;
  if (dbError?.code === 'P0002') {
    throw new NotFoundException(dbError.message);
  }
  if (dbError?.code === '22000' || dbError?.code === 'P0001') {
    throw new BadRequestException(dbError.message);
  }
  throw error;
}
