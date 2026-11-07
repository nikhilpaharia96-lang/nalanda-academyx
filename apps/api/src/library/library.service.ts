import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { and, eq, inArray, like, or, sql, type SQL } from "drizzle-orm";
import { db, schema } from "@nalanda/database";
import { AuditService } from "../common/audit.service";
import { OwnershipService } from "../common/ownership.service";
import { toFriendlyConflictError } from "../common/db-errors";
import type { AuthenticatedUser } from "../common/types/authenticated-user";

const isAdmin = (u: AuthenticatedUser) => u.role === "SUPER_ADMIN" || u.role === "ADMIN";

@Injectable()
export class LibraryService {
  constructor(
    private readonly auditService: AuditService,
    private readonly ownershipService: OwnershipService,
  ) {}

  // --- Catalogue ---------------------------------------------------------------
  listBooks(opts: { q?: string; includeInactive?: boolean } = {}) {
    const conds: SQL[] = [];
    if (!opts.includeInactive) conds.push(eq(schema.books.active, true));
    if (opts.q?.trim()) {
      const term = `%${opts.q.trim()}%`;
      conds.push(or(like(schema.books.title, term), like(schema.books.author, term), like(schema.books.isbn, term))!);
    }
    return db
      .select()
      .from(schema.books)
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(schema.books.title);
  }

  async createBook(
    dto: { title: string; author?: string; isbn?: string; category?: string; location?: string; totalCopies: number },
    actorId: string,
  ) {
    try {
      const [row] = await db
        .insert(schema.books)
        .values({ ...dto, availableCopies: dto.totalCopies })
        .returning();
      await this.auditService.log({ userId: actorId, action: "BOOK_CREATE", entity: "Book", entityId: row.id });
      return row;
    } catch (err) {
      throw toFriendlyConflictError(err, "ISBN");
    }
  }

  async updateBook(
    id: string,
    dto: Partial<{ title: string; author: string; isbn: string; category: string; location: string; totalCopies: number; active: boolean }>,
    actorId: string,
  ) {
    const [book] = await db.select().from(schema.books).where(eq(schema.books.id, id));
    if (!book) throw new NotFoundException("Book not found");

    const patch: Record<string, unknown> = { ...dto, updatedAt: new Date().toISOString() };
    if (dto.totalCopies !== undefined) {
      // Copies currently out on loan must still fit within the new total.
      const onLoan = book.totalCopies - book.availableCopies;
      if (dto.totalCopies < onLoan) {
        throw new ConflictException(`${onLoan} copies are currently issued; total cannot be below that`);
      }
      patch.availableCopies = dto.totalCopies - onLoan;
    }
    try {
      const [row] = await db.update(schema.books).set(patch).where(eq(schema.books.id, id)).returning();
      await this.auditService.log({ userId: actorId, action: "BOOK_UPDATE", entity: "Book", entityId: id });
      return row;
    } catch (err) {
      throw toFriendlyConflictError(err, "ISBN");
    }
  }

  // --- Requests & loans -----------------------------------------------------------
  async createRequest(dto: { bookId: string; studentId?: string; remarks?: string }, user: AuthenticatedUser) {
    let studentId: string;
    if (user.role === "STUDENT") {
      studentId = user.profileId!;
    } else if (isAdmin(user)) {
      if (!dto.studentId) throw new BadRequestException("studentId is required");
      studentId = dto.studentId;
    } else {
      throw new ForbiddenException();
    }

    const [book] = await db.select().from(schema.books).where(eq(schema.books.id, dto.bookId));
    if (!book || !book.active) throw new NotFoundException("Book not found");
    const [student] = await db.select().from(schema.students).where(eq(schema.students.id, studentId));
    if (!student) throw new NotFoundException("Student not found");

    const [open] = await db
      .select()
      .from(schema.bookRequests)
      .where(
        and(
          eq(schema.bookRequests.bookId, dto.bookId),
          eq(schema.bookRequests.studentId, studentId),
          inArray(schema.bookRequests.status, ["REQUESTED", "ISSUED"]),
        ),
      );
    if (open) throw new ConflictException("This student already has an open request or loan for this book");

    const [row] = await db
      .insert(schema.bookRequests)
      .values({ bookId: dto.bookId, studentId, remarks: dto.remarks })
      .returning();
    await this.auditService.log({ userId: user.sub, action: "BOOK_REQUEST", entity: "BookRequest", entityId: row.id });
    return row;
  }

  /** Atomic: the conditional UPDATE only succeeds while a copy is available, so two admins can't over-issue. */
  async issue(requestId: string, dueDate: string, actorId: string) {
    const request = await this.getRequestOrThrow(requestId);
    if (request.status !== "REQUESTED") throw new ConflictException(`Request is ${request.status}, not REQUESTED`);

    const [updatedBook] = await db
      .update(schema.books)
      .set({ availableCopies: sql`${schema.books.availableCopies} - 1`, updatedAt: new Date().toISOString() })
      .where(and(eq(schema.books.id, request.bookId), sql`${schema.books.availableCopies} > 0`))
      .returning();
    if (!updatedBook) throw new ConflictException("No copies of this book are currently available");

    const [row] = await db
      .update(schema.bookRequests)
      .set({ status: "ISSUED", issuedAt: new Date().toISOString(), dueDate, updatedAt: new Date().toISOString() })
      .where(and(eq(schema.bookRequests.id, requestId), eq(schema.bookRequests.status, "REQUESTED")))
      .returning();
    if (!row) {
      // Lost a race with another admin action: give the copy back.
      await db
        .update(schema.books)
        .set({ availableCopies: sql`${schema.books.availableCopies} + 1` })
        .where(eq(schema.books.id, request.bookId));
      throw new ConflictException("Request was changed by someone else; please refresh");
    }
    await this.auditService.log({ userId: actorId, action: "BOOK_ISSUE", entity: "BookRequest", entityId: requestId });
    return row;
  }

  async returnBook(requestId: string, actorId: string) {
    const request = await this.getRequestOrThrow(requestId);
    if (request.status !== "ISSUED") throw new ConflictException(`Request is ${request.status}, not ISSUED`);

    const [row] = await db
      .update(schema.bookRequests)
      .set({ status: "RETURNED", returnedAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
      .where(and(eq(schema.bookRequests.id, requestId), eq(schema.bookRequests.status, "ISSUED")))
      .returning();
    if (!row) throw new ConflictException("Request was changed by someone else; please refresh");

    await db
      .update(schema.books)
      .set({ availableCopies: sql`${schema.books.availableCopies} + 1`, updatedAt: new Date().toISOString() })
      .where(eq(schema.books.id, request.bookId));
    await this.auditService.log({ userId: actorId, action: "BOOK_RETURN", entity: "BookRequest", entityId: requestId });
    return row;
  }

  async reject(requestId: string, remarks: string | undefined, actorId: string) {
    const request = await this.getRequestOrThrow(requestId);
    if (request.status !== "REQUESTED") throw new ConflictException(`Request is ${request.status}, not REQUESTED`);
    const [row] = await db
      .update(schema.bookRequests)
      .set({ status: "REJECTED", remarks: remarks ?? request.remarks, updatedAt: new Date().toISOString() })
      .where(eq(schema.bookRequests.id, requestId))
      .returning();
    await this.auditService.log({ userId: actorId, action: "BOOK_REJECT", entity: "BookRequest", entityId: requestId });
    return row;
  }

  /** Students can withdraw their own pending request. */
  async cancel(requestId: string, user: AuthenticatedUser) {
    const request = await this.getRequestOrThrow(requestId);
    if (!isAdmin(user) && !(user.role === "STUDENT" && request.studentId === user.profileId)) throw new ForbiddenException();
    if (request.status !== "REQUESTED") throw new ConflictException("Only pending requests can be cancelled");
    const [row] = await db
      .update(schema.bookRequests)
      .set({ status: "CANCELLED", updatedAt: new Date().toISOString() })
      .where(eq(schema.bookRequests.id, requestId))
      .returning();
    await this.auditService.log({ userId: user.sub, action: "BOOK_REQUEST_CANCEL", entity: "BookRequest", entityId: requestId });
    return row;
  }

  /** Admins see everything; students their own; parents their linked children's. Teachers have no library view. */
  async listRequests(user: AuthenticatedUser, filters: { status?: string; studentId?: string } = {}) {
    const conds: SQL[] = [];
    if (filters.status) conds.push(eq(schema.bookRequests.status, filters.status));

    if (isAdmin(user)) {
      if (filters.studentId) conds.push(eq(schema.bookRequests.studentId, filters.studentId));
    } else if (user.role === "STUDENT") {
      conds.push(eq(schema.bookRequests.studentId, user.profileId!));
    } else if (user.role === "PARENT") {
      const ids = await this.ownershipService.getLinkedStudentIds(user.profileId!);
      if (filters.studentId) {
        if (!ids.includes(filters.studentId)) throw new ForbiddenException();
        conds.push(eq(schema.bookRequests.studentId, filters.studentId));
      } else {
        if (ids.length === 0) return [];
        conds.push(inArray(schema.bookRequests.studentId, ids));
      }
    } else {
      throw new ForbiddenException();
    }

    return db
      .select({
        id: schema.bookRequests.id,
        status: schema.bookRequests.status,
        requestedAt: schema.bookRequests.requestedAt,
        issuedAt: schema.bookRequests.issuedAt,
        dueDate: schema.bookRequests.dueDate,
        returnedAt: schema.bookRequests.returnedAt,
        remarks: schema.bookRequests.remarks,
        bookId: schema.books.id,
        bookTitle: schema.books.title,
        studentId: schema.students.id,
        studentName: schema.students.name,
      })
      .from(schema.bookRequests)
      .innerJoin(schema.books, eq(schema.books.id, schema.bookRequests.bookId))
      .innerJoin(schema.students, eq(schema.students.id, schema.bookRequests.studentId))
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(schema.bookRequests.requestedAt);
  }

  private async getRequestOrThrow(id: string) {
    const [row] = await db.select().from(schema.bookRequests).where(eq(schema.bookRequests.id, id));
    if (!row) throw new NotFoundException("Book request not found");
    return row;
  }
}
