import { ConflictException, ForbiddenException } from "@nestjs/common";
import { db, schema } from "@nalanda/database";
import { eq } from "drizzle-orm";
import { LibraryService } from "./library.service";
import { AuditService } from "../common/audit.service";
import { OwnershipService } from "../common/ownership.service";
import { admin, makeBase, makeStudent, studentUser } from "../campus.fixtures";

describe("LibraryService", () => {
  const service = new LibraryService(new AuditService(), new OwnershipService());

  it("runs request -> issue -> return and keeps copy counts right", async () => {
    const base = await makeBase();
    const student = await makeStudent(base);
    const book = await service.createBook({ title: "Algebra", totalCopies: 2 }, admin.sub);

    const req = await service.createRequest({ bookId: book.id }, studentUser(student.id));
    expect(req.status).toBe("REQUESTED");

    const issued = await service.issue(req.id, "2026-12-01", admin.sub);
    expect(issued.status).toBe("ISSUED");
    expect((await db.select().from(schema.books).where(eq(schema.books.id, book.id)))[0].availableCopies).toBe(1);

    const returned = await service.returnBook(req.id, admin.sub);
    expect(returned.status).toBe("RETURNED");
    expect((await db.select().from(schema.books).where(eq(schema.books.id, book.id)))[0].availableCopies).toBe(2);
  });

  it("refuses to issue when no copies are left, and never goes negative", async () => {
    const base = await makeBase();
    const s1 = await makeStudent(base, "1");
    const s2 = await makeStudent(base, "2");
    const book = await service.createBook({ title: "Rare Book", totalCopies: 1 }, admin.sub);
    const r1 = await service.createRequest({ bookId: book.id }, studentUser(s1.id));
    const r2 = await service.createRequest({ bookId: book.id }, studentUser(s2.id));

    await service.issue(r1.id, "2026-12-01", admin.sub);
    await expect(service.issue(r2.id, "2026-12-01", admin.sub)).rejects.toBeInstanceOf(ConflictException);
    expect((await db.select().from(schema.books).where(eq(schema.books.id, book.id)))[0].availableCopies).toBe(0);
  });

  it("blocks duplicate open requests and double-issue / double-return", async () => {
    const base = await makeBase();
    const student = await makeStudent(base);
    const book = await service.createBook({ title: "Physics", totalCopies: 3 }, admin.sub);
    const req = await service.createRequest({ bookId: book.id }, studentUser(student.id));
    await expect(service.createRequest({ bookId: book.id }, studentUser(student.id))).rejects.toBeInstanceOf(ConflictException);

    await service.issue(req.id, "2026-12-01", admin.sub);
    await expect(service.issue(req.id, "2026-12-01", admin.sub)).rejects.toBeInstanceOf(ConflictException);
    await service.returnBook(req.id, admin.sub);
    await expect(service.returnBook(req.id, admin.sub)).rejects.toBeInstanceOf(ConflictException);
  });

  it("students only see their own requests and cannot cancel someone else's", async () => {
    const base = await makeBase();
    const a = await makeStudent(base, "1");
    const b = await makeStudent(base, "2");
    const book = await service.createBook({ title: "Chemistry", totalCopies: 2 }, admin.sub);
    const ra = await service.createRequest({ bookId: book.id }, studentUser(a.id));
    await service.createRequest({ bookId: book.id }, studentUser(b.id));

    const mine = await service.listRequests(studentUser(a.id));
    expect(mine).toHaveLength(1);
    expect(mine[0].studentId).toBe(a.id);
    await expect(service.cancel(ra.id, studentUser(b.id))).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("won't shrink total copies below what is on loan", async () => {
    const base = await makeBase();
    const student = await makeStudent(base);
    const book = await service.createBook({ title: "Biology", totalCopies: 3 }, admin.sub);
    const req = await service.createRequest({ bookId: book.id }, studentUser(student.id));
    await service.issue(req.id, "2026-12-01", admin.sub);
    await expect(service.updateBook(book.id, { totalCopies: 0 }, admin.sub)).rejects.toBeInstanceOf(ConflictException);
    const updated = await service.updateBook(book.id, { totalCopies: 5 }, admin.sub);
    expect(updated.availableCopies).toBe(4);
  });
});
