import { HttpErrorResponse } from '@angular/common/http';

/** Angular resources may wrap the original error in `cause`; this returns the HttpErrorResponse either way. */
export function unwrapError(error: unknown): unknown {
  const cause = (error as { cause?: unknown } | null)?.cause;
  return cause instanceof HttpErrorResponse ? cause : error;
}

/** Turns an API ProblemDetails / validation response into one readable message. */
export function describeError(raw: unknown): string {
  const error = unwrapError(raw);

  if (!(error instanceof HttpErrorResponse)) {
    return 'Something went wrong. Please try again.';
  }

  if (error.status === 0) {
    return 'Cannot reach the server. Check that the API is running and try again.';
  }

  const body = error.error as
    | { detail?: string; title?: string; errors?: Record<string, string[]> }
    | null;

  const validation = body?.errors ? Object.values(body.errors).flat() : [];
  if (validation.length > 0) {
    return validation.join(' ');
  }

  if (body?.detail) {
    return body.detail;
  }

  if (error.status >= 500) {
    return 'The server hit an error. Please try again in a moment.';
  }

  return body?.title ?? 'The request failed.';
}
