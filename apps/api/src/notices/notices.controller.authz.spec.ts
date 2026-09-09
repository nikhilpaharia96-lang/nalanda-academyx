import { GUARDS_METADATA } from "@nestjs/common/constants";
import { NoticesController } from "./notices.controller";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { OptionalJwtAuthGuard } from "../common/guards/optional-jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { ROLES_KEY } from "../common/decorators/roles.decorator";

function guardsFor(methodName: keyof NoticesController) {
  return Reflect.getMetadata(GUARDS_METADATA, NoticesController.prototype[methodName]) ?? [];
}

function rolesFor(methodName: keyof NoticesController) {
  return Reflect.getMetadata(ROLES_KEY, NoticesController.prototype[methodName]);
}

describe("NoticesController authorization wiring", () => {
  it.each(["list", "getBySlug"] as const)("%s is publicly readable (only OptionalJwtAuthGuard, no role requirement)", (method) => {
    expect(guardsFor(method)).toEqual([OptionalJwtAuthGuard]);
    expect(rolesFor(method)).toBeUndefined();
  });

  it.each(["create", "update", "publish", "remove", "getById"] as const)(
    "%s is admin-only (JwtAuthGuard + RolesGuard, SUPER_ADMIN/ADMIN)",
    (method) => {
      expect(guardsFor(method)).toEqual([JwtAuthGuard, RolesGuard]);
      expect(rolesFor(method)).toEqual(["SUPER_ADMIN", "ADMIN"]);
    },
  );
});
