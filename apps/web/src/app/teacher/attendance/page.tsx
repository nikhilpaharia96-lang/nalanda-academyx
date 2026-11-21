"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { TeacherShell } from "@/components/teacher-shell";
import { TEACHER_NAV } from "@/lib/teacher-nav";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api-client";
import { ChevronLeft, Loader2 } from "lucide-react";

interface Assignment { id: string; classId: string; sectionId: string; subject: string; academicYearId: string }
interface ClassRow { id: string; name: string }
interface SectionRow { id: string; name: string; classId: string }
type Status = "PRESENT" | "ABSENT" | "LATE" | "LEAVE" | "NOT_MARKED";
interface RosterEntry { studentId: string; name: string; rollNumber: string; status: Status; remarks: string | null }

const field = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 outline-none focus:border-portal";
const card = "rounded-3xl border border-slate-200 bg-white shadow-sm";

const todayStr = () => new Date().toLocaleDateString("sv");

function AttendanceContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();

  const [assignments, setAssignments] = useState<Assignment[] | null>(null);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [sections, setSections] = useState<SectionRow[]>([]);
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [date, setDate] = useState(todayStr());
  const [roster, setRoster] = useState<RosterEntry[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!user?.profileId) return;
    Promise.all([
      api.get<Assignment[]>(`/teachers/${user.profileId}/assignments`),
      api.get<ClassRow[]>("/classes"),
      api.get<SectionRow[]>("/sections"),
    ])
      .then(([a, c, s]) => {
        setAssignments(a);
        setClasses(c);
        setSections(s);
        const pre = a.find((x) => x.classId === searchParams.get("classId") && x.sectionId === searchParams.get("sectionId")) ?? a[0];
        setClassId(pre?.classId ?? "");
        setSectionId(pre?.sectionId ?? "");
      })
      .catch(() => setAssignments([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.profileId]);

  const classIds = useMemo(() => Array.from(new Set((assignments ?? []).map((a) => a.classId))), [assignments]);
  const sectionIds = useMemo(
    () => Array.from(new Set((assignments ?? []).filter((a) => a.classId === classId).map((a) => a.sectionId))),
    [assignments, classId],
  );
  useEffect(() => {
    if (sectionIds.length > 0 && !sectionIds.includes(sectionId)) setSectionId(sectionIds[0]);
  }, [sectionIds, sectionId]);

  const asg = assignments?.find((a) => a.classId === classId && a.sectionId === sectionId);

  const loadRoster = useCallback(async () => {
    if (!asg) return;
    setRoster(null);
    setMessage(null);
    try {
      const data = await api.get<RosterEntry[]>(`/attendance/class/${asg.classId}/section/${asg.sectionId}?date=${date}`);
      // One Present/Absent switch per student: anyone not yet marked starts as Absent; the teacher switches present students on.
      setRoster(data.map((r) => (r.status === "NOT_MARKED" ? { ...r, status: "ABSENT" as Status } : r)));
    } catch (err) {
      setMessage({ type: "error", text: err instanceof ApiError ? err.message : "Roster load nahi ho paya" });
      setRoster([]);
    }
  }, [asg, date]);

  useEffect(() => {
    loadRoster();
  }, [loadRoster]);

  function toggle(studentId: string) {
    setRoster((prev) => prev?.map((r) => (r.studentId === studentId ? { ...r, status: r.status === "PRESENT" ? "ABSENT" : "PRESENT" } : r)) ?? prev);
  }

  function markAllPresent() {
    setRoster((prev) => prev?.map((r) => ({ ...r, status: "PRESENT" as Status })) ?? prev);
  }

  async function save() {
    if (!asg || !roster) return;
    setSaving(true);
    setMessage(null);
    try {
      await api.post("/attendance/mark", {
        classId: asg.classId,
        sectionId: asg.sectionId,
        academicYearId: asg.academicYearId,
        date,
        records: roster
          .filter((r) => r.status !== "NOT_MARKED")
          .map((r) => ({ studentId: r.studentId, status: r.status, remarks: r.remarks?.trim() || undefined })),
      });
      setMessage({ type: "success", text: "Attendance save ho gayi." });
      loadRoster();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof ApiError ? err.message : "Attendance save nahi ho payi" });
    } finally {
      setSaving(false);
    }
  }

  const summary = useMemo(() => {
    const r = roster ?? [];
    return {
      present: r.filter((x) => x.status === "PRESENT").length,
      absent: r.filter((x) => x.status === "ABSENT").length,
      total: r.length,
    };
  }, [roster]);

  const className = (id: string) => classes.find((c) => c.id === id)?.name ?? id;
  const sectionName = (id: string) => sections.find((s) => s.id === id)?.name ?? id;
  const noAssignments = assignments !== null && assignments.length === 0;

  return (
    <TeacherShell navItems={TEACHER_NAV} loginPath="/teacher/login" allowedRoles={["TEACHER"]} portalLabel="Teacher Portal" title="Attendance">
      <div className="mx-auto max-w-3xl space-y-4 p-4 sm:p-6">
        <div className="flex justify-end">
          <Link href="/teacher/dashboard" className="flex items-center gap-1 rounded-xl bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
            <ChevronLeft className="h-4 w-4" /> Dashboard
          </Link>
        </div>

        {/* Class & date selection */}
        <section className={`${card} p-5`}>
          <h2 className="font-display text-xl font-bold text-slate-900">Class &amp; Date Selection</h2>
          {noAssignments ? (
            <p className="mt-3 text-sm text-slate-500">Abhi koi class assign nahi hai. Admin se class, section aur subject assign karwayein.</p>
          ) : (
            <>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <label className="block text-sm font-medium text-slate-700">
                  Class
                  <select className={`${field} mt-1`} value={classId} onChange={(e) => setClassId(e.target.value)}>
                    {classIds.map((id) => (
                      <option key={id} value={id}>
                        {className(id)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Section
                  <select className={`${field} mt-1`} value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
                    {sectionIds.map((id) => (
                      <option key={id} value={id}>
                        {sectionName(id)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="col-span-2 block text-sm font-medium text-slate-700 sm:col-span-1">
                  Date
                  <input type="date" className={`${field} mt-1`} value={date} max={todayStr()} onChange={(e) => setDate(e.target.value || todayStr())} />
                </label>
              </div>
              <button
                onClick={markAllPresent}
                disabled={!roster || roster.length === 0}
                className="mt-4 w-full rounded-xl bg-portal py-3 text-lg font-semibold text-white transition hover:bg-blue-600 disabled:opacity-50"
              >
                Mark All Present
              </button>
              <button
                onClick={save}
                disabled={saving || !roster || roster.length === 0}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-navy py-3 text-lg font-semibold text-white transition hover:bg-navy-light disabled:opacity-50"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Attendance
              </button>
              <p className="mt-3 text-sm text-slate-800">
                <span className="font-bold">Note:</span> Same date par dobara save karne par attendance update ho jayegi.
              </p>
            </>
          )}
        </section>

        {message && (
          <p className={`rounded-2xl px-4 py-3 text-sm ${message.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`} role="status">
            {message.text}
          </p>
        )}

        {!noAssignments && (
          <>
            {/* Summary tally */}
            <section className={`${card} p-5`}>
              <h2 className="font-display text-xl font-bold text-slate-900">Attendance Summary Tally</h2>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-slate-100 px-4 py-2.5 text-base text-slate-900">
                <Tally dot="bg-emerald-500" label="Present" value={summary.present} />
                <Tally dot="bg-red-500" label="Absent" value={summary.absent} />
                <span className="ml-auto font-bold">Total: {summary.total}</span>
              </div>
            </section>

            {/* Student list */}
            <section className={`${card} overflow-hidden`}>
              <h2 className="p-5 pb-3 font-display text-xl font-bold text-slate-900">Manage Student Attendance ({roster?.length ?? 0})</h2>
              <div className="border-y border-slate-200 bg-blue-50 px-5 py-2 text-sm font-bold text-slate-900">Roll No.</div>

              {!roster && (
                <div className="flex items-center gap-2 p-5 text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading roster…
                </div>
              )}
              {roster && roster.length === 0 && !message && <p className="p-5 text-sm text-slate-500">Is class/section me koi active student nahi hai.</p>}

              <ul className="divide-y divide-slate-200">
                {roster?.map((entry) => (
                  <li key={entry.studentId} className="flex items-center gap-3 px-5 py-3.5">
                    <span className="w-7 shrink-0 font-mono text-lg text-slate-900">{entry.rollNumber.padStart(2, "0")}</span>
                    <span className="min-w-0 flex-1 truncate text-lg text-slate-900">{entry.name.replace("(DEMO) ", "")}</span>
                    <button
                      role="switch"
                      aria-checked={entry.status === "PRESENT"}
                      aria-label={`${entry.name}: ${entry.status === "PRESENT" ? "Present" : "Absent"}`}
                      onClick={() => toggle(entry.studentId)}
                      className="flex shrink-0 items-center gap-2"
                    >
                      <span className={`w-14 text-right text-sm font-semibold ${entry.status === "PRESENT" ? "text-emerald-700" : entry.status === "ABSENT" ? "text-red-600" : "text-slate-500"}`}>
                        {entry.status === "PRESENT" ? "Present" : entry.status === "ABSENT" ? "Absent" : entry.status === "LATE" ? "Late" : "Leave"}
                      </span>
                      <span className={`relative inline-block h-7 w-12 rounded-full transition ${entry.status === "PRESENT" ? "bg-emerald-500" : entry.status === "ABSENT" ? "bg-red-500" : "bg-slate-300"}`}>
                        <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${entry.status === "PRESENT" ? "left-[1.375rem]" : "left-0.5"}`} />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </div>
    </TeacherShell>
  );
}

function Tally({ dot, label, value }: { dot: string; label: string; value: number }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-3 w-3 rounded-full ${dot}`} /> {label}: <span className="font-bold">{value}</span>
    </span>
  );
}

export default function TeacherAttendancePage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-portal" /></div>}>
      <AttendanceContent />
    </Suspense>
  );
}
