import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { z } from "zod";
import { NoticesService } from "./notices.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { OptionalJwtAuthGuard } from "../common/guards/optional-jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { NOTICE_CATEGORIES } from "@nalanda/shared";
import type { AuthenticatedUser } from "../common/types/authenticated-user";

const createSchema = z.object({
  title: z.string().min(3),
  content: z.string().min(1),
  category: z.enum(NOTICE_CATEGORIES),
  important: z.boolean().optional(),
  attachmentUrl: z.string().url().optional(),
  externalLink: z.string().url().optional(),
  ctaText: z.string().max(60).optional(),
  noticeDate: z.string().date().optional(),
  displayOrder: z.number().int().optional(),
});
const updateSchema = createSchema.partial();
const publishSchema = z.object({ published: z.boolean() });

function isAdmin(user?: AuthenticatedUser) {
  return user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";
}

// Reads (list/getBySlug) are PUBLIC — no login required — so the public
// website can consume published notices directly. OptionalJwtAuthGuard
// still populates `user` when a valid admin session is present, so admins
// previewing the admin portal also see unpublished drafts. Every mutating
// route stays behind the full JwtAuthGuard + RolesGuard + @Roles check.
@Controller("notices")
export class NoticesController {
  constructor(private readonly noticesService: NoticesService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  list(@Query("search") search: string | undefined, @Query("category") category: string | undefined, @CurrentUser() user: AuthenticatedUser | undefined) {
    return this.noticesService.list({ search, category, includeUnpublished: isAdmin(user) });
  }

  // Admin-only lookup by primary key, used by the admin edit form. This is a
  // two-segment path ("id/:id") so it never collides with the public
  // single-segment ":slug" route below.
  @Get("id/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  getById(@Param("id") id: string) {
    return this.noticesService.getById(id);
  }

  @Get(":slug")
  @UseGuards(OptionalJwtAuthGuard)
  getBySlug(@Param("slug") slug: string, @CurrentUser() user: AuthenticatedUser | undefined) {
    return this.noticesService.getBySlug(slug, isAdmin(user));
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  create(@Body(new ZodValidationPipe(createSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.noticesService.create(dto, user.sub);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  update(@Param("id") id: string, @Body(new ZodValidationPipe(updateSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.noticesService.update(id, dto, user.sub);
  }

  @Patch(":id/publish")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  publish(@Param("id") id: string, @Body(new ZodValidationPipe(publishSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.noticesService.setPublished(id, dto.published, user.sub);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  remove(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.noticesService.remove(id, user.sub);
  }
}
