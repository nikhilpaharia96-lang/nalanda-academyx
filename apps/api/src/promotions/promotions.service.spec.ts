import { db, schema } from "@nalanda/database";
import { eq } from "drizzle-orm";
import { PromotionsService } from "./promotions.service";
import { AuditService } from "../common/audit.service";
import { OwnershipService } from "../common/ownership.service";
import { admin, makeBase, makeStudent } from "../campus.fixtures";

describe("PromotionsService", () => {
  const service = new PromotionsService(new AuditService(), new OwnershipService());
  const get = async (id: string) => (await db.select().from(schema.students).where(eq(schema.students.id, id)))[0];

  it("promotes, repeats and graduates in one batch and records history", async () => {
    const base = await makeBase();
    const p = await makeStudent(base, "1");
    const r = await makeStudent(base, "2");
    const g = await makeStudent(base, "3");

    const out = await service.promote(
      {
        fromAcademicYearId: base.year.id,
        toAcademicYearId: base.year2.id,
        items: [
          { studentId: p.id, outcome: "PROMOTED", toClassId: base.c2.id, toSectionId: base.s2.id },
          { studentId: r.id, outcome: "REPEATED" },
          { studentId: g.id, outcome: "GRADUATED" },
        ],
      },
      admin.sub,
    );
    expect(out).toMatchObject({ succeeded: 3, failed: 0 });

    expect(await get(p.id)).toMatchObject({ classId: base.c2.id, sectionId: base.s2.id, academicYearId: base.year2.id });
    expect(await get(r.id)).toMatchObject({ classId: base.c1.id, academicYearId: base.year2.id });
    expect(await get(g.id)).toMatchObject({ status: "GRADUATED", academicYearId: base.year.id });
    expect(await service.history(p.id, admin)).toHaveLength(1);
  });

  it("is idempotent: re-submitting the same batch changes nothing", async () => {
    const base = await makeBase();
    const s = await makeStudent(base, "1");
    const dto = {
      fromAcademicYearId: base.year.id,
      toAcademicYearId: base.year2.id,
      items: [{ studentId: s.id, outcome: "PROMOTED" as const, toClassId: base.c2.id, toSectionId: base.s2.id }],
    };
    await service.promote(dto, admin.sub);
    const again = await service.promote(dto, admin.sub);
    expect(again).toMatchObject({ succeeded: 0, failed: 1 });
    expect(await service.history(s.id, admin)).toHaveLength(1);
  });

  it("reports per-student errors without blocking the rest", async () => {
    const base = await makeBase();
    const good = await makeStudent(base, "1");
    const bad = await makeStudent(base, "2");
    const out = await service.promote(
      {
        fromAcademicYearId: base.year.id,
        toAcademicYearId: base.year2.id,
        items: [
          { studentId: bad.id, outcome: "PROMOTED", toClassId: base.c2.id, toSectionId: base.s1.id }, // wrong section for class
          { studentId: good.id, outcome: "PROMOTED", toClassId: base.c2.id, toSectionId: base.s2.id },
          { studentId: "missing", outcome: "REPEATED" },
        ],
      },
      admin.sub,
    );
    expect(out).toMatchObject({ succeeded: 1, failed: 2 });
    expect((await get(bad.id)).classId).toBe(base.c1.id);
  });

  it("picks a free roll number when the old one is taken in the destination", async () => {
    const base = await makeBase();
    const existing = await makeStudent({ year: base.year2, c1: base.c2, s1: base.s2 }, "1");
    const mover = await makeStudent(base, "1");
    const out = await service.promote(
      {
        fromAcademicYearId: base.year.id,
        toAcademicYearId: base.year2.id,
        items: [{ studentId: mover.id, outcome: "PROMOTED", toClassId: base.c2.id, toSectionId: base.s2.id }],
      },
      admin.sub,
    );
    expect(out.results[0].ok).toBe(true);
    expect(out.results[0].rollNumber).toBe("2");
    expect(existing.rollNumber).toBe("1");
  });
});
