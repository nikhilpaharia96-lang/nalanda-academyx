import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { z } from "zod";
import { EventsService } from "./events.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { OptionalJwtAuthGuard } from "../common/guards/optional-jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import type { AuthenticatedUser } from "../common/types/authenticated-user";

const createSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(1),
  category: z.string().min(1),
  date: z.string().date(),
  time: z.string().optional(),
  endTime: z.string().optional(),
  location: z.string().optional(),
  featured: z.boolean().optional(),
  coverImageUrl: z.string().url().optional(),
  registrationUrl: z.string().url().optional(),
  ctaText: z.string().max(60).optional(),
  displayOrder: z.number().int().optional(),
});
const updateSchema = createSchema.partial();
const publishSchema = z.object({ published: z.boolean() });
const addImageSchema = z.object({ imageUrl: z.string().url(), displayOrder: z.number().int().default(0) });

function isAdmin(user?: AuthenticatedUser) {
  return user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";
}

// Reads are public (see notices.controller.ts for the rationale); mutations
// stay fully guarded.
@Controller("events")
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  list(@Query("when") when: "upcoming" | "past" | undefined, @Query("category") category: string | undefined, @CurrentUser() user: AuthenticatedUser | undefined) {
    return this.eventsService.list({ when, category, includeUnpublished: isAdmin(user) });
  }

  // Admin-only lookup by primary key, used by the admin edit form. This is a
  // two-segment path ("id/:id") so it never collides with the public
  // single-segment ":slug" route below.
  @Get("id/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  getById(@Param("id") id: string) {
    return this.eventsService.getById(id);
  }

  @Get(":slug")
  @UseGuards(OptionalJwtAuthGuard)
  getBySlug(@Param("slug") slug: string, @CurrentUser() user: AuthenticatedUser | undefined) {
    return this.eventsService.getBySlug(slug, isAdmin(user));
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  create(@Body(new ZodValidationPipe(createSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.eventsService.create(dto, user.sub);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  update(@Param("id") id: string, @Body(new ZodValidationPipe(updateSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.eventsService.update(id, dto, user.sub);
  }

  @Patch(":id/publish")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  publish(@Param("id") id: string, @Body(new ZodValidationPipe(publishSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.eventsService.setPublished(id, dto.published, user.sub);
  }

  @Post(":id/images")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  addImage(@Param("id") id: string, @Body(new ZodValidationPipe(addImageSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.eventsService.addImage(id, dto.imageUrl, dto.displayOrder, user.sub);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  remove(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.eventsService.remove(id, user.sub);
  }
}
