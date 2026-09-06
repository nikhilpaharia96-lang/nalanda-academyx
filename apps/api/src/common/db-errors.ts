import { ConflictException } from "@nestjs/common";

/**
 * Detects a unique-constraint violation from either driver this project
 * dispatches between — better-sqlite3 throws with a message containing
 * "UNIQUE constraint failed", node-postgres throws with `code === "23505"`
 * — and converts it into a clean 409 Conflict with a human-readable message
 * instead of letting the raw driver error surface as a generic 500.
 * Any other error is re-thrown unchanged.
 */
export function toFriendlyConflictError(err: unknown, fieldDescription: string): unknown {
  const message = err instanceof Error ? err.message : String(err);
  const code = (err as { code?: string })?.code;

  const isUniqueViolation = message.includes("UNIQUE constraint failed") || code === "23505";

  if (isUniqueViolation) {
    return new ConflictException(`A record with this ${fieldDescription} already exists`);
  }

  return err;
}
