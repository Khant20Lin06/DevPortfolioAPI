export class HttpError extends Error {
  constructor(status, code, message, details = {}) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends HttpError {
  constructor(fieldErrors) {
    super(400, "VALIDATION_ERROR", "Please check your input and try again.", { fieldErrors });
  }
}

export class RateLimitError extends HttpError {
  constructor(retryAfterSeconds) {
    super(429, "RATE_LIMITED", "Too many requests. Please try again later.", { retryAfterSeconds });
  }
}