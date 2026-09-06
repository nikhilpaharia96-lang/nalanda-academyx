import { Body, Controller, Get, Put, UseGuards } from "@nestjs/common";
import { StoreSettingsService } from "./store-settings.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { updateStoreSettingsSchema } from "@nalanda/shared";
import type { AuthenticatedUser } from "../common/types/authenticated-user";

@Controller("store/settings")
@UseGuards(JwtAuthGuard, RolesGuard)
export class StoreSettingsController {
  constructor(private readonly settingsService: StoreSettingsService) {}

  // Readable by everyone signed in — Students/Parents need pickup
  // instructions, collection hours, and delivery availability at checkout.
  @Get()
  get() {
    return this.settingsService.get();
  }

  @Put()
  @Roles("SUPER_ADMIN", "ADMIN")
  update(@Body(new ZodValidationPipe(updateStoreSettingsSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.settingsService.update(dto, user.sub);
  }
}
