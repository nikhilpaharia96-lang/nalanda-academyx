import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { StoreCategoriesService } from "./store-categories.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { createStoreCategorySchema, updateStoreCategorySchema } from "@nalanda/shared";
import type { AuthenticatedUser } from "../common/types/authenticated-user";

@Controller("store/categories")
@UseGuards(JwtAuthGuard, RolesGuard)
export class StoreCategoriesController {
  constructor(private readonly categoriesService: StoreCategoriesService) {}

  // Every authenticated role can read the category list (Admin needs it for
  // the product form, Students/Parents need it to filter the catalog).
  // Only Admin ever sees inactive categories, regardless of the query flag.
  @Get()
  list(@Query("includeInactive") includeInactive: string | undefined, @CurrentUser() user: AuthenticatedUser) {
    const isAdmin = user.role === "SUPER_ADMIN" || user.role === "ADMIN";
    return this.categoriesService.list(isAdmin && includeInactive === "true");
  }

  @Post()
  @Roles("SUPER_ADMIN", "ADMIN")
  create(@Body(new ZodValidationPipe(createStoreCategorySchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.categoriesService.create(dto, user.sub);
  }

  @Patch(":id")
  @Roles("SUPER_ADMIN", "ADMIN")
  update(@Param("id") id: string, @Body(new ZodValidationPipe(updateStoreCategorySchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.categoriesService.update(id, dto, user.sub);
  }
}
