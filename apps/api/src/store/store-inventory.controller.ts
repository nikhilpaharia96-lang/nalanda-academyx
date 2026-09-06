import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { StoreInventoryService } from "./store-inventory.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { adjustStockSchema } from "@nalanda/shared";
import type { AuthenticatedUser } from "../common/types/authenticated-user";

@Controller("store/inventory")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("SUPER_ADMIN", "ADMIN")
export class StoreInventoryController {
  constructor(private readonly inventoryService: StoreInventoryService) {}

  @Get()
  list() {
    return this.inventoryService.listInventory();
  }

  @Get(":productId/history")
  history(@Param("productId") productId: string) {
    return this.inventoryService.history(productId);
  }

  @Post("adjust")
  adjust(@Body(new ZodValidationPipe(adjustStockSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.inventoryService.adjust(dto.productId, dto.variantId, dto.quantityChange, { actorUserId: user.sub, note: dto.note });
  }
}
