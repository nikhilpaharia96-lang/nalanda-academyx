import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { promoteSchema } from "@nalanda/shared";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import type { AuthenticatedUser } from "../common/types/authenticated-user";
import { PromotionsService } from "./promotions.service";

@Controller("promotions")
@UseGuards(JwtAuthGuard, RolesGuard)
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Get("candidates")
  @Roles("SUPER_ADMIN", "ADMIN")
  candidates(
    @Query("classId") classId: string,
    @Query("sectionId") sectionId: string,
    @Query("academicYearId") academicYearId: string,
  ) {
    return this.promotionsService.listCandidates(classId, sectionId, academicYearId);
  }

  @Post()
  @Roles("SUPER_ADMIN", "ADMIN")
  promote(@Body(new ZodValidationPipe(promoteSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.promotionsService.promote(dto, user.sub);
  }

  @Get("student/:studentId")
  history(@Param("studentId") studentId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.promotionsService.history(studentId, user);
  }
}
