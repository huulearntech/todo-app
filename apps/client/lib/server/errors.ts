export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly responseData?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = "Unauthorized", responseData?: unknown) {
    super(401, message, responseData);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = "Forbidden", responseData?: unknown) {
    super(403, message, responseData);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends ApiError {
  constructor(message = "Not Found", responseData?: unknown) {
    super(404, message, responseData);
    this.name = "NotFoundError";
  }
}

export class InternalServerError extends ApiError {
  constructor(message = "Internal Server Error", responseData?: unknown) {
    super(500, message, responseData);
    this.name = "InternalServerError";
  }
}
