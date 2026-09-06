import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { StoreCouponsService } from "./store-coupons.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { createCouponSchema, updateCouponSchema } from "@nalanda/shared";
import type { AuthenticatedUser } from "../common/types/authenticated-user";

@Controller("store/coupons")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("SUPER_ADMIN", "ADMIN")
export class StoreCouponsController {
  constructor(private readonly couponsService: StoreCouponsService) {}

  @Get()
  list() {
    return this.couponsService.list();
  }

  @Post()
  create(@Body(new ZodValidationPipe(createCouponSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.couponsService.create(dto, user.sub);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body(new ZodValidationPipe(updateCouponSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.couponsService.update(id, dto, user.sub);
  }
}
