import { ForbiddenException, Injectable } from "@nestjs/common";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@nalanda/database";
import type { AuthenticatedUser } from "./types/authenticated-user";

@Injectable()
export class OwnershipService {
  /** Throws ForbiddenException unless `user` may view/act on `studentId`'s records. */
  async assertCanAccessStudent(studentId: string, user: AuthenticatedUser) {
    if (user.role === "SUPER_ADMIN" || user.role === "ADMIN") return;

    if (user.role === "STUDENT") {
      if (user.profileId !== studentId) throw new ForbiddenException();
      return;
    }

    if (user.role === "PARENT") {
      const [link] = await db
        .select()
        .from(schema.parentStudents)
        .where(and(eq(schema.parentStudents.parentId, user.profileId!), eq(schema.parentStudents.studentId, studentId)));
      if (!link) throw new ForbiddenException();
      return;
    }

    if (user.role === "TEACHER") {
      const [student] = await db.select().from(schema.students).where(eq(schema.students.id, studentId));
      if (!student) throw new ForbiddenException();
      const [assignment] = await db
        .select()
        .from(schema.teacherClassAssignments)
        .where(
          and(
            eq(schema.teacherClassAssignments.teacherId, user.profileId!),
            eq(schema.teacherClassAssignments.classId, student.classId),
            eq(schema.teacherClassAssignments.sectionId, student.sectionId),
          ),
        );
      if (!assignment) throw new ForbiddenException();
      return;
    }

    throw new ForbiddenException();
  }

  /** Throws unless `user` (a TEACHER) is assigned to this class+section. Admins always pass. */
  async assertTeacherAssignedToClass(classId: string, sectionId: string, user: AuthenticatedUser) {
    if (user.role === "SUPER_ADMIN" || user.role === "ADMIN") return;
    if (user.role !== "TEACHER") throw new ForbiddenException();

    const [assignment] = await db
      .select()
      .from(schema.teacherClassAssignments)
      .where(
        and(
          eq(schema.teacherClassAssignments.teacherId, user.profileId!),
          eq(schema.teacherClassAssignments.classId, classId),
          eq(schema.teacherClassAssignments.sectionId, sectionId),
        ),
      );
    if (!assignment) throw new ForbiddenException("You are not assigned to this class/section");
  }

  /** Returns the student ids for a parent's linked children. */
  async getLinkedStudentIds(parentId: string): Promise<string[]> {
    const rows = await db.select().from(schema.parentStudents).where(eq(schema.parentStudents.parentId, parentId));
    return rows.map((r) => r.studentId);
  }
}
