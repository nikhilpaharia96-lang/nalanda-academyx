"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PortalShell } from "@/components/portal-shell";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api-client";
import { LayoutDashboard, ClipboardCheck, User, Loader2, Check, X, Clock, Coffee } from "lucide-react";

const NAV = [
  { href: "/teacher/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/teacher/attendance", label: "Attendance", icon: ClipboardCheck },
  { href: "/teacher/profile", label: "Profile", icon: User },
];

interface Assignment { id: string; classId: string; sectionId: string; subject: string; academicYearId: string }
interface ClassRow { id: string; name: string }
interface SectionRow { id: string; name: string; classId: string }
type Status = "PRESENT" | "ABSENT" | "LATE" | "LEAVE" | "NOT_MARKED";
interface RosterEntry { studentId: string; name: string; rollNumber: string; status: Status; remarks: string | null }

const STATUS_CONFIG: Record<Exclude<Status, "NOT_MARKED">, { label: string; icon: typeof Check; activeClass: string }> = {
  PRESENT: { label: "P", icon: Check, activeClass: "bg-emerald-600 text-white border-emerald-600" },
  ABSENT: { label: "A", icon: X, activeClass: "bg-red-600 text-white border-red-600" },
  LATE: { label: "L", icon: Clock, activeClass: "bg-amber-500 text-white border-amber-500" },
  LEAVE: { label: "Lv", icon: Coffee, activeClass: "bg-neutral-500 text-white border-neutral-500" },
};

function AttendanceContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [sections, setSections] = useState<SectionRow[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [roster, setRoster] = useState<RosterEntry[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!user?.profileId) return;
    Promise.all([
      api.get<Assignment[]>(`/teachers/${user.profileId}/assignments`),
      api.get<ClassRow[]>("/classes"),
      api.get<SectionRow[]>("/sections"),
    ]).then(([a, c, s]) => {
      setAssignments(a);
      setClasses(c);
      setSections(s);
      const qsClassId = searchParams.get("classId");
      const qsSectionId = searchParams.get("sectionId");
      const preselected = a.find((x) => x.classId === qsClassId && x.sectionId === qsSectionId);
      setSelectedAssignmentId((preselected ?? a[0])?.id ?? "");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.profileId]);

  const selectedAssignment = assignments.find((a) => a.id === selectedAssignmentId);

  const loadRoster = useCallback(async () => {
    if (!selectedAssignment) return;
    setRoster(null);
    setMessage(null);
    try {
      const data = await api.get<RosterEntry[]>(`/attendance/class/${selectedAssignment.classId}/section/${selectedAssignment.sectionId}?date=${date}`);
      setRoster(data);
    } catch (err) {
      setMessage({ type: "error", text: err instanceof ApiError ? err.message : "Failed to load roster" });
      setRoster([]);
    }
  }, [selectedAssignment, date]);

  useEffect(() => {
    loadRoster();
  }, [loadRoster]);

  function setStatus(studentId: string, status: Status) {
    setRoster((prev) => (prev ? prev.map((r) => (r.studentId === studentId ? { ...r, status } : r)) : prev));
  }

  function markAllPresent() {
    setRoster((prev) => (prev ? prev.map((r) => ({ ...r, status: "PRESENT" as Status })) : prev));
  }

  async function save() {
    if (!selectedAssignment || !roster) return;
    const unmarked = roster.filter((r) => r.status === "NOT_MARKED");
    if (unmarked.length > 0 && !confirm(`${unmarked.length} student(s) are still unmarked and will be skipped. Continue saving the rest?`)) {
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await api.post("/attendance/mark", {
        classId: selectedAssignment.classId,
        sectionId: selectedAssignment.sectionId,
        academicYearId: selectedAssignment.academicYearId,
        date,
        records: roster.filter((r) => r.status !== "NOT_MARKED").map((r) => ({ studentId: r.studentId, status: r.status, remarks: r.remarks || undefined })),
      });
      setMessage({ type: "success", text: "Attendance saved." });
      loadRoster();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof ApiError ? err.message : "Failed to save attendance" });
    } finally {
      setSaving(false);
    }
  }

  const summary = useMemo(() => {
    if (!roster) return null;
    return {
      present: roster.filter((r) => r.status === "PRESENT").length,
      absent: roster.filter((r) => r.status === "ABSENT").length,
      late: roster.filter((r) => r.status === "LATE").length,
      leave: roster.filter((r) => r.status === "LEAVE").length,
      unmarked: roster.filter((r) => r.status === "NOT_MARKED").length,
    };
  }, [roster]);

  const className = (id?: string) => classes.find((c) => c.id === id)?.name ?? "";
  const sectionName = (id?: string) => sections.find((s) => s.id === id)?.name ?? "";

  return (
    <PortalShell navItems={NAV} loginPath="/teacher/login" allowedRoles={["TEACHER"]} portalLabel="Teacher Portal">
      <div className="ledger-bg border-b border-neutral-200 bg-white px-4 py-5 sm:px-8 sm:py-6">
        <p className="font-mono text-xs uppercase tracking-widest text-academic">Teacher Portal</p>
        <h1 className="font-display text-xl font-bold text-navy sm:text-2xl">Mark Attendance</h1>
      </div>

      {/* Sticky controls — class/section + date pickers stay reachable on small screens */}
      <div className="sticky top-0 z-10 space-y-3 border-b border-neutral-200 bg-white px-4 py-3 sm:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <select
            value={selectedAssignmentId}
            onChange={(e) => setSelectedAssignmentId(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2.5 text-sm sm:w-auto"
          >
            {assignments.length === 0 && <option>No assigned classes</option>}
            {assignments.map((a) => (
              <option key={a.id} value={a.id}>
                {className(a.classId)} — {sectionName(a.sectionId)} ({a.subject})
              </option>
            ))}
          </select>
          <input
            type="date"
            value={date}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2.5 text-sm sm:w-auto"
          />
          <button
            onClick={markAllPresent}
            disabled={!roster || roster.length === 0}
            className="w-full whitespace-nowrap rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50 sm:w-auto"
          >
            Mark All Present
          </button>
        </div>
        {summary && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-600">
            <span className="font-medium text-emerald-700">{summary.present} present</span>
            <span className="font-medium text-red-700">{summary.absent} absent</span>
            <span className="font-medium text-amber-700">{summary.late} late</span>
            <span className="font-medium text-neutral-500">{summary.leave} leave</span>
            {summary.unmarked > 0 && <span className="font-medium text-navy">{summary.unmarked} not marked</span>}
          </div>
        )}
      </div>

      <div className="p-4 pb-28 sm:p-8">
        {message && (
          <p className={`mb-4 rounded-md px-4 py-3 text-sm ${message.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
            {message.text}
          </p>
        )}

        {!roster && (
          <div className="flex items-center gap-2 py-10 text-neutral-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading roster…
          </div>
        )}

        {roster && roster.length === 0 && !message && (
          <p className="rounded-lg border border-neutral-200 bg-white p-6 text-sm text-neutral-500">No active students in this class/section.</p>
        )}

        <ul className="space-y-2">
          {roster?.map((entry) => (
            <li key={entry.studentId} className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-3 shadow-sm">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-navy">{entry.name}</p>
                <p className="font-mono text-xs text-neutral-500">Roll {entry.rollNumber}</p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                {(Object.keys(STATUS_CONFIG) as (keyof typeof STATUS_CONFIG)[]).map((status) => {
                  const cfg = STATUS_CONFIG[status];
                  const isActive = entry.status === status;
                  return (
                    <button
                      key={status}
                      onClick={() => setStatus(entry.studentId, status)}
                      aria-label={`Mark ${entry.name} as ${status}`}
                      aria-pressed={isActive}
                      className={`flex h-10 w-10 items-center justify-center rounded-md border text-sm font-bold transition ${
                        isActive ? cfg.activeClass : "border-neutral-300 bg-white text-neutral-500 hover:border-neutral-400"
                      }`}
                    >
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Fixed save bar — thumb-reachable on mobile */}
      {roster && roster.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 border-t border-neutral-200 bg-white p-4 shadow-[0_-2px_8px_rgba(0,0,0,0.06)] sm:sticky">
          <button
            onClick={save}
            disabled={saving}
            className="mx-auto flex w-full max-w-md items-center justify-center gap-2 rounded-md bg-academic py-3 font-semibold text-white transition hover:bg-academic-light disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Attendance
          </button>
        </div>
      )}
    </PortalShell>
  );
}

export default function TeacherAttendancePage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-academic" /></div>}>
      <AttendanceContent />
    </Suspense>
  );
}
