import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { z } from "zod";
import { bookIssueSchema, bookRequestCreateSchema, bookSchema, bookUpdateSchema } from "@nalanda/shared";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import type { AuthenticatedUser } from "../common/types/authenticated-user";
import { LibraryService } from "./library.service";

const rejectSchema = z.object({ remarks: z.string().optional() });

@Controller("library")
@UseGuards(JwtAuthGuard, RolesGuard)
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  @Get("books")
  listBooks(@Query("q") q: string | undefined, @CurrentUser() user: AuthenticatedUser) {
    const admin = user.role === "SUPER_ADMIN" || user.role === "ADMIN";
    return this.libraryService.listBooks({ q, includeInactive: admin });
  }

  @Post("books")
  @Roles("SUPER_ADMIN", "ADMIN")
  createBook(@Body(new ZodValidationPipe(bookSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.libraryService.createBook(dto, user.sub);
  }

  @Patch("books/:id")
  @Roles("SUPER_ADMIN", "ADMIN")
  updateBook(@Param("id") id: string, @Body(new ZodValidationPipe(bookUpdateSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.libraryService.updateBook(id, dto, user.sub);
  }

  @Get("requests")
  @Roles("SUPER_ADMIN", "ADMIN", "STUDENT", "PARENT")
  listRequests(
    @Query("status") status: string | undefined,
    @Query("studentId") studentId: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.libraryService.listRequests(user, { status, studentId });
  }

  @Post("requests")
  @Roles("SUPER_ADMIN", "ADMIN", "STUDENT")
  createRequest(@Body(new ZodValidationPipe(bookRequestCreateSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.libraryService.createRequest(dto, user);
  }

  @Post("requests/:id/issue")
  @Roles("SUPER_ADMIN", "ADMIN")
  issue(@Param("id") id: string, @Body(new ZodValidationPipe(bookIssueSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.libraryService.issue(id, dto.dueDate, user.sub);
  }

  @Post("requests/:id/return")
  @Roles("SUPER_ADMIN", "ADMIN")
  returnBook(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.libraryService.returnBook(id, user.sub);
  }

  @Post("requests/:id/reject")
  @Roles("SUPER_ADMIN", "ADMIN")
  reject(@Param("id") id: string, @Body(new ZodValidationPipe(rejectSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.libraryService.reject(id, dto.remarks, user.sub);
  }

  @Post("requests/:id/cancel")
  @Roles("SUPER_ADMIN", "ADMIN", "STUDENT")
  cancel(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.libraryService.cancel(id, user);
  }
}
