import { Global, Module } from "@nestjs/common";
import { TokenService } from "./token.service";
import { AuditService } from "./audit.service";
import { OwnershipService } from "./ownership.service";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { OptionalJwtAuthGuard } from "./guards/optional-jwt-auth.guard";
import { RolesGuard } from "./guards/roles.guard";

@Global()
@Module({
  providers: [TokenService, AuditService, OwnershipService, JwtAuthGuard, OptionalJwtAuthGuard, RolesGuard],
  exports: [TokenService, AuditService, OwnershipService, JwtAuthGuard, OptionalJwtAuthGuard, RolesGuard],
})
export class CommonModule {}
