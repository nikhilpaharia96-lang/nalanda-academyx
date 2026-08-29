import { randomBytes } from "crypto";

/**
 * Generates a URL-safe, sortable-enough unique id without pulling in an
 * external cuid/nanoid dependency. Format: <timestamp base36>-<random>.
 */
export function createId(): string {
  const time = Date.now().toString(36);
  const rand = randomBytes(9).toString("base64url");
  return `c${time}${rand}`;
}
