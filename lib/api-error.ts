import { NextResponse } from "next/server";

import {
  createRequestId,
  logger,
} from "@/lib/logger";

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(
    message: string,
    status = 500,
    code = "INTERNAL_ERROR"
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export function apiErrorResponse(
  error: unknown,
  context: {
    route: string;
    operation?: string;
    userId?: string;
    requestId?: string;
  }
) {
  const requestId =
    context.requestId ?? createRequestId();

  const isApiError = error instanceof ApiError;

  const status =
    isApiError ? error.status : 500;

  const publicMessage =
    isApiError
      ? error.message
      : "Something went wrong. Please try again.";

  const code =
    isApiError
      ? error.code
      : "INTERNAL_ERROR";

  logger.error(
    isApiError
      ? "API request failed"
      : "Unhandled API error",
    {
      requestId,
      userId: context.userId,
      route: context.route,
      operation: context.operation,
      error,
    }
  );

  return NextResponse.json(
    {
      error: publicMessage,
      code,
      requestId,
    },
    { status }
  );
}

export function unauthorizedResponse(
  requestId = createRequestId()
) {
  return NextResponse.json(
    {
      error: "Authentication required.",
      code: "UNAUTHORIZED",
      requestId,
    },
    { status: 401 }
  );
}

export function forbiddenResponse(
  requestId = createRequestId()
) {
  return NextResponse.json(
    {
      error: "You do not have permission to perform this action.",
      code: "FORBIDDEN",
      requestId,
    },
    { status: 403 }
  );
}
