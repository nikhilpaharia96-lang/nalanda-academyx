// These tests assert the *decorator wiring* on each route — which guards it
// runs behind, and which roles it requires — rather than re-implementing
// JwtAuthGuard/RolesGuard's own logic (that's already exercised wherever
// those guards themselves are tested). This is what actually proves "public
// users can only read, only ADMIN/SUPER_ADMIN can mutate" for this
// controller, since that split lives entirely in these decorators.
import { GUARDS_METADATA } from "@nestjs/common/constants";
import { EventsController } from "./events.controller";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { OptionalJwtAuthGuard } from "../common/guards/optional-jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { ROLES_KEY } from "../common/decorators/roles.decorator";

function guardsFor(methodName: keyof EventsController) {
  return Reflect.getMetadata(GUARDS_METADATA, EventsController.prototype[methodName]) ?? [];
}

function rolesFor(methodName: keyof EventsController) {
  return Reflect.getMetadata(ROLES_KEY, EventsController.prototype[methodName]);
}

describe("EventsController authorization wiring", () => {
  it.each(["list", "getBySlug"] as const)("%s is publicly readable (only OptionalJwtAuthGuard, no role requirement)", (method) => {
    expect(guardsFor(method)).toEqual([OptionalJwtAuthGuard]);
    expect(rolesFor(method)).toBeUndefined();
  });

  it.each(["create", "update", "publish", "addImage", "remove", "getById"] as const)(
    "%s is admin-only (JwtAuthGuard + RolesGuard, SUPER_ADMIN/ADMIN)",
    (method) => {
      expect(guardsFor(method)).toEqual([JwtAuthGuard, RolesGuard]);
      expect(rolesFor(method)).toEqual(["SUPER_ADMIN", "ADMIN"]);
    },
  );
});
