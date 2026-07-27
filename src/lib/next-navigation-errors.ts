/**
 * Next.js navigation control-flow errors — phải rethrow khi bắt trong try/catch.
 * Dùng API chính thức thay vì `digest.startsWith` (split URL có `;` dễ lệch).
 */
import { isRedirectError } from 'next/dist/client/components/redirect';
import { isNotFoundError } from 'next/dist/client/components/not-found';

export function isNextNavigationError(error: unknown): boolean {
  return isRedirectError(error) || isNotFoundError(error);
}

export function rethrowIfNextNavigation(error: unknown): void {
  if (isNextNavigationError(error)) {
    throw error;
  }
}

export { isRedirectError, isNotFoundError };
