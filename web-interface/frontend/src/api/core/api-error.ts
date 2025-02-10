export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public data?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }

  static fromResponse(response: Response, data?: unknown): ApiError {
    let message = "Request failed";
    if (data && typeof data === "object" && "message" in data) {
      message = String(data.message);
    } else if (response.statusText) {
      message = response.statusText;
    }
    return new ApiError(message, response.status, data);
  }

  static fromError(error: unknown): ApiError {
    if (error instanceof ApiError) {
      return error;
    }
    const message = error instanceof Error ? error.message : "An unexpected error occurred";
    return new ApiError(message);
  }
}
