import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { StoreBundlesService } from "./store-bundles.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { createBundleSchema, updateBundleSchema } from "@nalanda/shared";
import type { AuthenticatedUser } from "../common/types/authenticated-user";

@Controller("store/bundles")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("SUPER_ADMIN", "ADMIN")
export class StoreBundlesController {
  constructor(private readonly bundlesService: StoreBundlesService) {}

  @Get()
  list() {
    return this.bundlesService.list();
  }

  @Post()
  create(@Body(new ZodValidationPipe(createBundleSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.bundlesService.create(dto, user.sub);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body(new ZodValidationPipe(updateBundleSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.bundlesService.update(id, dto, user.sub);
  }
}

/** Buyer-facing: "Class 5 Complete Book Set" style listings for a class. */
@Controller("store/bundles-catalog")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("SUPER_ADMIN", "ADMIN", "STUDENT", "PARENT")
export class StoreBundlesCatalogController {
  constructor(private readonly bundlesService: StoreBundlesService) {}

  @Get(":classId")
  listForClass(@Param("classId") classId: string) {
    return this.bundlesService.listForClass(classId);
  }
}
