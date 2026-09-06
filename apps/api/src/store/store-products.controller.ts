import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { StoreProductsService } from "./store-products.service";
import { OwnershipService } from "../common/ownership.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import {
  addProductImageSchema,
  createStoreProductSchema,
  createVariantSchema,
  listStoreProductsQuerySchema,
  updateStoreProductSchema,
  updateVariantSchema,
} from "@nalanda/shared";
import type { AuthenticatedUser } from "../common/types/authenticated-user";

@Controller("store/products")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("SUPER_ADMIN", "ADMIN")
export class StoreProductsController {
  constructor(private readonly productsService: StoreProductsService) {}

  @Get()
  list(@Query(new ZodValidationPipe(listStoreProductsQuerySchema)) query: any) {
    return this.productsService.listAdmin(query);
  }

  @Get(":id")
  getById(@Param("id") id: string) {
    return this.productsService.getFullById(id);
  }

  @Post()
  create(@Body(new ZodValidationPipe(createStoreProductSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.productsService.create(dto, user.sub);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body(new ZodValidationPipe(updateStoreProductSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.productsService.update(id, dto, user.sub);
  }

  @Post(":id/images")
  addImage(@Param("id") id: string, @Body(new ZodValidationPipe(addProductImageSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.productsService.addImage(id, dto, user.sub);
  }

  @Delete(":id/images/:imageId")
  removeImage(@Param("id") id: string, @Param("imageId") imageId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.productsService.removeImage(id, imageId, user.sub);
  }

  @Post(":id/variants")
  addVariant(@Param("id") id: string, @Body(new ZodValidationPipe(createVariantSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.productsService.addVariant(id, dto, user.sub);
  }

  @Patch("variants/:variantId")
  updateVariant(@Param("variantId") variantId: string, @Body(new ZodValidationPipe(updateVariantSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.productsService.updateVariant(variantId, dto, user.sub);
  }
}

/** Buyer-facing catalog — a Student browsing for themself, or a Parent
 * browsing for one of their linked children. Deliberately a separate
 * controller/route (not nested under the Admin-only /store/products above)
 * so its much looser role/ownership rules never risk being accidentally
 * relaxed onto the Admin management endpoints or vice versa. */
@Controller("store/catalog")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("SUPER_ADMIN", "ADMIN", "STUDENT", "PARENT")
export class StoreCatalogController {
  constructor(
    private readonly productsService: StoreProductsService,
    private readonly ownershipService: OwnershipService,
  ) {}

  @Get(":studentId")
  async listForStudent(@Param("studentId") studentId: string, @CurrentUser() user: AuthenticatedUser) {
    await this.ownershipService.assertCanAccessStudent(studentId, user);
    return this.productsService.listForStudent(studentId);
  }
}
