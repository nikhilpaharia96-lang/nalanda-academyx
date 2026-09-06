import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { StoreOrdersService } from "./store-orders.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { checkoutSchema, listStoreOrdersQuerySchema, updateOrderStatusSchema } from "@nalanda/shared";
import type { AuthenticatedUser } from "../common/types/authenticated-user";

@Controller("store")
@UseGuards(JwtAuthGuard, RolesGuard)
export class StoreOrdersController {
  constructor(private readonly ordersService: StoreOrdersService) {}

  @Post("checkout")
  @Roles("STUDENT", "PARENT")
  checkout(@Body(new ZodValidationPipe(checkoutSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.ordersService.checkout(user, dto);
  }

  @Get("orders/mine")
  @Roles("STUDENT", "PARENT")
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.ordersService.listMine(user);
  }

  @Get("orders")
  @Roles("SUPER_ADMIN", "ADMIN")
  listAdmin(@Query(new ZodValidationPipe(listStoreOrdersQuerySchema)) query: any) {
    return this.ordersService.listAdmin(query);
  }

  // Any authenticated role may fetch a single order by id — ownership for
  // non-admins is enforced inside the service exactly like GET
  // /payments/:id/receipt does for fee payments.
  @Get("orders/:id")
  getById(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    const isAdmin = user.role === "SUPER_ADMIN" || user.role === "ADMIN";
    return isAdmin ? this.ordersService.getOrderWithItems(id) : this.ordersService.getOrderForUser(id, user);
  }

  @Patch("orders/:id/status")
  @Roles("SUPER_ADMIN", "ADMIN")
  updateStatus(@Param("id") id: string, @Body(new ZodValidationPipe(updateOrderStatusSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.ordersService.updateStatus(id, dto, user.sub);
  }
}
