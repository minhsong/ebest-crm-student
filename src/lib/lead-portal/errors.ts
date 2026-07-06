export class LeadPortalUnauthorizedError extends Error {
  readonly code = 'UNAUTHORIZED' as const;

  constructor(message = 'UNAUTHORIZED') {
    super(message);
    this.name = 'LeadPortalUnauthorizedError';
  }
}

export function isLeadPortalUnauthorizedError(
  error: unknown,
): error is LeadPortalUnauthorizedError {
  return error instanceof LeadPortalUnauthorizedError;
}
