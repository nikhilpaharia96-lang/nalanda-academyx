import type { Role } from "@nalanda/shared";

export interface AuthenticatedUser {
  sub: string; // user id
  email: string;
  role: Role;
  // Resolved profile id (student.id / teacher.id / parent.id) attached by
  // the JwtAuthGuard so downstream services can do ownership checks without
  // an extra DB round-trip.
  profileId?: string;
}
