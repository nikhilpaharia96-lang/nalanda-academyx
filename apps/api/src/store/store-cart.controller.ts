import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { StoreCartService } from "./store-cart.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { addBundleToCartSchema, addToCartSchema, updateCartItemSchema } from "@nalanda/shared";
import type { AuthenticatedUser } from "../common/types/authenticated-user";

@Controller("store/cart")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("STUDENT", "PARENT")
export class StoreCartController {
  constructor(private readonly cartService: StoreCartService) {}

  @Get(":studentId")
  getCart(@Param("studentId") studentId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.cartService.getCart(user, studentId);
  }

  @Post("items")
  addItem(@Body(new ZodValidationPipe(addToCartSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.cartService.addItem(user, dto);
  }

  @Post("bundle")
  addBundle(@Body(new ZodValidationPipe(addBundleToCartSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.cartService.addBundle(user, dto);
  }

  @Patch(":studentId/items/:itemId")
  updateItem(@Param("studentId") studentId: string, @Param("itemId") itemId: string, @Body(new ZodValidationPipe(updateCartItemSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.cartService.updateItemQuantity(user, studentId, itemId, dto.quantity);
  }

  @Delete(":studentId/items/:itemId")
  removeItem(@Param("studentId") studentId: string, @Param("itemId") itemId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.cartService.removeItem(user, studentId, itemId);
  }
}
