import { Module } from "@nestjs/common";
import { ExamsController } from "./exams.controller";
import { ExamsService } from "./exams.service";

// Exams & Results module.
//
// Documented follow-up (not implemented in this increment, intentionally
// scoped out to avoid over-engineering a first pass): the grading bands in
// ExamsService.computeGrade() are a fixed, sensible default rather than an
// admin-configurable table. If a school needs custom grade boundaries, the
// clean extension point is a `grading_scales` table keyed by academic year
// (or globally), read once per request in ExamsService, with a fallback to
// the current default bands — no other part of this module would need to
// change.
@Module({
  controllers: [ExamsController],
  providers: [ExamsService],
})
export class ExamsModule {}
