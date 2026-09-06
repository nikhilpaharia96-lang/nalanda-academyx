import { Injectable } from "@nestjs/common";
import { db, schema } from "@nalanda/database";

interface AuditEntry {
  userId?: string;
  action: string; // e.g. "LOGIN", "STUDENT_CREATE", "ATTENDANCE_MARK"
  entity: string; // e.g. "User", "Student", "Attendance"
  entityId?: string;
  description?: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  async log(entry: AuditEntry) {
    // Audit logging must never be able to turn an otherwise-successful
    // operation into a failed request. If the audit insert itself fails
    // (e.g. a transient DB blip), swallow it here and report it to stderr
    // rather than letting it propagate and produce a misleading 500 for an
    // action that actually completed.
    try {
      await db.insert(schema.auditLogs).values(entry);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[AuditService] failed to write audit log entry:", entry.action, err);
    }
  }
}
