/**
 * Safely extracts a human-readable message from an unknown caught value.
 * Use this in catch blocks instead of `(e: any).message`.
 */
export function getErrorMessage(error: unknown, fallback = 'An unexpected error occurred.'): string {
  return error instanceof Error ? error.message : fallback;
}
