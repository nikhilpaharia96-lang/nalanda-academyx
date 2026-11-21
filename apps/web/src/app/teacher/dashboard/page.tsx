"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { TeacherShell } from "@/components/teacher-shell";
import { TEACHER_NAV } from "@/lib/teacher-nav";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";
import { errMsg, type Subject } from "@/components/campus-ui";
import type { LeaveRow } from "@/components/campus-panels";
import { AlertTriangle, Loader2 } from "lucide-react";

interface Assignment { id: string; classId: string; sectionId: string; subject: string; academicYearId: string }
interface ClassRow { id: string; name: string }
interface SectionRow { id: string; name: string; classId: string }
interface TeacherProfile { name: string }
type Status = "PRESENT" | "ABSENT" | "LATE" | "LEAVE" | "NOT_MARKED";
interface RosterEntry { studentId: string; name: string; rollNumber: string; status: Status; remarks: string | null }

const STATUS_BUTTONS: { value: Exclude<Status, "NOT_MARKED">; label: string; dot: string; active: string }[] = [
  { value: "PRESENT", label: "Present", dot: "bg-emerald-500", active: "bg-emerald-600 text-white border-emerald-600" },
  { value: "ABSENT", label: "Absent", dot: "bg-red-500", active: "bg-red-600 text-white border-red-600" },
  { value: "LATE", label: "Late", dot: "bg-orange-500", active: "bg-orange-500 text-white border-orange-500" },
  { value: "LEAVE", label: "Leave", dot: "bg-yellow-400", active: "bg-yellow-400 text-slate-900 border-yellow-400" },
];

const field = "w-full rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-3 text-base text-slate-900 outline-none focus:border-portal focus:bg-white";
const darkBtn = "w-full rounded-xl bg-navy px-4 py-3 text-base font-semibold text-white transition hover:bg-navy-light disabled:opacity-50";
const card = "rounded-3xl border border-slate-200 bg-white p-5 shadow-sm";
const cardTitle = "font-display text-2xl font-bold text-slate-900";

const today = () => new Date().toLocaleDateString("sv");
const fmtDate = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" });

export default function TeacherDashboardPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [assignments, setAssignments] = useState<Assignment[] | null>(null);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [sections, setSections] = useState<SectionRow[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    if (!user?.profileId) return;
    api.get<TeacherProfile>(`/teachers/${user.profileId}`).then(setProfile).catch(() => {});
    Promise.all([
      api.get<Assignment[]>(`/teachers/${user.profileId}/assignments`),
      api.get<ClassRow[]>("/classes"),
      api.get<SectionRow[]>("/sections"),
      api.get<Subject[]>("/subjects").catch(() => [] as Subject[]),
    ])
      .then(([a, c, s, sub]) => {
        setAssignments(a);
        setClasses(c);
        setSections(s);
        setSubjects(sub);
      })
      .catch(() => setAssignments([]));
  }, [user?.profileId]);

  const className = (id: string) => classes.find((c) => c.id === id)?.name ?? "?";
  const sectionName = (id: string) => sections.find((s) => s.id === id)?.name ?? "?";
  // "Class 8-A (English)"
  const label = (a: Assignment) => `${className(a.classId)}-${sectionName(a.sectionId)} (${a.subject})`;

  return (
    <TeacherShell navItems={TEACHER_NAV} loginPath="/teacher/login" allowedRoles={["TEACHER"]} portalLabel="Teacher Portal">
      <div className="mx-auto max-w-3xl space-y-4 p-4 sm:p-6">
        {/* Welcome banner */}
        <section className="overflow-hidden rounded-3xl bg-portal text-white shadow-md">
          <div className="p-6">
            <h2 className="font-display text-2xl font-bold leading-tight sm:text-3xl">
              Welcome back, {profile ? profile.name.replace("(DEMO) ", "") : "Teacher"}!
            </h2>
            <p className="mt-3 text-lg text-blue-50">My Assigned Classes:</p>
            <p className="text-lg text-blue-50">
              {!assignments ? "Loading…" : assignments.length === 0 ? "No classes assigned yet" : assignments.map(label).join(", ")}
            </p>
          </div>
          <div className="flex items-start gap-3 bg-black/15 px-6 py-3 text-sm text-blue-50">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-300" />
            <p>Kuch na dikhe to: Pehle check karein ki Admin ne aapko class, section aur subject assign kiya hai ya nahi.</p>
          </div>
        </section>

        {/* Assigned classes */}
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="p-5">
            <h3 className={cardTitle}>Assigned Classes</h3>
            {!assignments ? (
              <Loader2 className="mt-4 h-5 w-5 animate-spin text-slate-400" />
            ) : assignments.length === 0 ? (
              <p className="mt-3 text-slate-500">Abhi koi class assign nahi hui hai.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-lg text-slate-900">
                {assignments.map((a) => (
                  <li key={a.id}>
                    <span className="font-bold">
                      {className(a.classId)}-{sectionName(a.sectionId)}
                    </span>{" "}
                    ({a.subject})
                  </li>
                ))}
              </ul>
            )}
          </div>
          <p className="bg-slate-100 px-5 py-3 text-sm text-slate-700">
            <span className="font-bold text-slate-900">Important:</span> Agar aapki class yahan nahi dikh rahi, toh admin se check karein ki aapko class, section aur subject assigned hai ya nahi.
          </p>
        </section>

        {assignments && assignments.length > 0 && (
          <>
            <AttendanceCard assignments={assignments} classes={classes} sections={sections} />
            <HomeworkCard assignments={assignments} subjects={subjects} label={label} />
          </>
        )}

        <LeaveCard />
      </div>
    </TeacherShell>
  );
}

/* ----------------------------- Daily Attendance ----------------------------- */

function AttendanceCard({ assignments, classes, sections }: { assignments: Assignment[]; classes: ClassRow[]; sections: SectionRow[] }) {
  const classIds = useMemo(() => Array.from(new Set(assignments.map((a) => a.classId))), [assignments]);
  const [classId, setClassId] = useState(assignments[0]?.classId ?? "");
  const sectionIds = useMemo(() => Array.from(new Set(assignments.filter((a) => a.classId === classId).map((a) => a.sectionId))), [assignments, classId]);
  const [sectionId, setSectionId] = useState(assignments[0]?.sectionId ?? "");
  const [date, setDate] = useState(today());
  const [roster, setRoster] = useState<RosterEntry[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!sectionIds.includes(sectionId)) setSectionId(sectionIds[0] ?? "");
  }, [sectionIds, sectionId]);

  const asg = assignments.find((a) => a.classId === classId && a.sectionId === sectionId);

  const loadRoster = useCallback(async () => {
    if (!asg) return;
    setRoster(null);
    try {
      setRoster(await api.get<RosterEntry[]>(`/attendance/class/${asg.classId}/section/${asg.sectionId}?date=${date}`));
    } catch (e) {
      setMessage({ type: "error", text: errMsg(e, "Roster load nahi ho paya") });
      setRoster([]);
    }
  }, [asg, date]);

  useEffect(() => {
    setMessage(null);
    loadRoster();
  }, [loadRoster]);

  const setStatus = (studentId: string, status: Status) => setRoster((p) => p?.map((r) => (r.studentId === studentId ? { ...r, status } : r)) ?? p);
  const markAllPresent = () => setRoster((p) => p?.map((r) => ({ ...r, status: "PRESENT" as Status })) ?? p);

  async function save() {
    if (!asg || !roster) return;
    const unmarked = roster.filter((r) => r.status === "NOT_MARKED").length;
    if (unmarked > 0 && !confirm(`${unmarked} student(s) abhi mark nahi hue hain aur skip honge. Baaki save karein?`)) return;
    setSaving(true);
    setMessage(null);
    try {
      await api.post("/attendance/mark", {
        classId: asg.classId,
        sectionId: asg.sectionId,
        academicYearId: asg.academicYearId,
        date,
        records: roster.filter((r) => r.status !== "NOT_MARKED").map((r) => ({ studentId: r.studentId, status: r.status, remarks: r.remarks || undefined })),
      });
      setMessage({ type: "success", text: "Attendance save ho gayi." });
      loadRoster();
    } catch (e) {
      setMessage({ type: "error", text: errMsg(e, "Attendance save nahi ho payi") });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={card}>
      <h3 className={cardTitle}>Daily Attendance</h3>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <select className={field} value={classId} onChange={(e) => setClassId(e.target.value)} aria-label="Class">
          {classIds.map((id) => (
            <option key={id} value={id}>
              {classes.find((c) => c.id === id)?.name ?? id}
            </option>
          ))}
        </select>
        <select className={field} value={sectionId} onChange={(e) => setSectionId(e.target.value)} aria-label="Section">
          {sectionIds.map((id) => (
            <option key={id} value={id}>
              {sections.find((s) => s.id === id)?.name ?? id}
            </option>
          ))}
        </select>
        <input type="date" className={field} value={date} max={today()} onChange={(e) => setDate(e.target.value)} aria-label="Date" />
        <button className={darkBtn} onClick={save} disabled={saving || !roster || roster.length === 0}>
          {saving ? "Saving…" : "Save Attendance"}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-800">
        {STATUS_BUTTONS.map((s) => (
          <span key={s.value} className="flex items-center gap-1.5">
            <span className={`h-3 w-3 rounded-full ${s.dot}`} /> {s.label}
          </span>
        ))}
      </div>

      {message && (
        <p className={`mt-3 rounded-xl px-3 py-2 text-sm ${message.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`} role="status">
          {message.text}
        </p>
      )}

      {!roster ? (
        <Loader2 className="mt-4 h-5 w-5 animate-spin text-slate-400" />
      ) : roster.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">Is class mein abhi koi student nahi hai.</p>
      ) : (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-slate-500">{roster.length} students</span>
            <button onClick={markAllPresent} className="font-semibold text-portal hover:underline">
              Sabko Present karo
            </button>
          </div>
          <ul className="divide-y divide-slate-200 rounded-2xl border border-slate-200">
            {roster.map((r) => (
              <li key={r.studentId} className="flex items-center justify-between gap-2 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{r.name.replace("(DEMO) ", "")}</p>
                  <p className="text-xs text-slate-500">Roll {r.rollNumber}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  {STATUS_BUTTONS.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setStatus(r.studentId, s.value)}
                      aria-pressed={r.status === s.value}
                      aria-label={s.label}
                      title={s.label}
                      className={`h-8 w-8 rounded-lg border text-xs font-bold ${r.status === s.value ? s.active : "border-slate-200 bg-white text-slate-500"}`}
                    >
                      {s.label === "Leave" ? "Lv" : s.label[0]}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="mt-3 text-sm text-slate-800">
        <span className="font-bold">Note:</span> Same date par dobara save karne par attendance update ho jayegi.
      </p>
    </section>
  );
}

/* ------------------------------ Assign Homework ------------------------------ */

function HomeworkCard({ assignments, subjects, label }: { assignments: Assignment[]; subjects: Subject[]; label: (a: Assignment) => string }) {
  const [sel, setSel] = useState(assignments[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(() => new Date(Date.now() + 864e5).toLocaleDateString("sv"));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const asg = assignments.find((a) => a.id === sel);
  const subjectId = subjects.find((s) => s.name.toLowerCase() === asg?.subject.toLowerCase())?.id;

  async function post() {
    if (!asg) return;
    setSaving(true);
    setMessage(null);
    try {
      await api.post("/homework", {
        classId: asg.classId,
        sectionId: asg.sectionId,
        academicYearId: asg.academicYearId,
        subjectId,
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate,
      });
      setTitle("");
      setDescription("");
      setMessage({ type: "success", text: "Homework assign ho gaya." });
    } catch (e) {
      setMessage({ type: "error", text: errMsg(e, "Homework assign nahi ho paya") });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={card}>
      <h3 className={cardTitle}>Assign Homework</h3>
      {assignments.length > 1 && (
        <select className={`${field} mt-4`} value={sel} onChange={(e) => setSel(e.target.value)} aria-label="Class and subject">
          {assignments.map((a) => (
            <option key={a.id} value={a.id}>
              {label(a)}
            </option>
          ))}
        </select>
      )}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <input className={field} placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input type="date" className={field} value={dueDate} min={today()} onChange={(e) => setDueDate(e.target.value)} aria-label="Due Date" />
        <input className={field} placeholder="Details" value={description} onChange={(e) => setDescription(e.target.value)} />
        <button className={darkBtn} onClick={post} disabled={saving || !title.trim() || !subjectId}>
          {saving ? "Assigning…" : "Assign Homework"}
        </button>
      </div>
      {!subjectId && asg && <p className="mt-2 text-xs text-amber-700">“{asg.subject}” subject school ki subject list me nahi mila — admin se check karein.</p>}
      {message && (
        <p className={`mt-3 rounded-xl px-3 py-2 text-sm ${message.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`} role="status">
          {message.text}
        </p>
      )}
    </section>
  );
}

/* ------------------------------- Leave Requests ------------------------------- */

function LeaveCard() {
  const [rows, setRows] = useState<LeaveRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    api
      .get<LeaveRow[]>("/leave?status=PENDING")
      .then((r) => {
        setRows(r);
        setError(null);
      })
      .catch((e) => {
        setError(errMsg(e));
        setRows([]);
      });
  }, []);
  useEffect(load, [load]);

  async function review(id: string, decision: "APPROVED" | "REJECTED") {
    setBusyId(id);
    try {
      await api.post(`/leave/${id}/review`, { decision, note: note.trim() || undefined });
      setNote("");
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusyId(null);
      load();
    }
  }

  return (
    <section className={card}>
      <div className="flex items-center justify-between gap-3">
        <h3 className={cardTitle}>Leave Requests{rows ? ` (${rows.length})` : ""}</h3>
        <button
          onClick={() => setShowNote((v) => !v)}
          aria-pressed={showNote}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${showNote ? "bg-portal text-white" : "bg-slate-200 text-slate-600"}`}
        >
          Add Note
        </button>
      </div>

      {showNote && <input className={`${field} mt-3`} placeholder="Note (approve/reject ke saath jayega)" value={note} onChange={(e) => setNote(e.target.value)} />}
      {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {!rows ? (
        <Loader2 className="mt-4 h-5 w-5 animate-spin text-slate-400" />
      ) : rows.length === 0 ? (
        <p className="mt-3 text-slate-500">Koi pending leave request nahi hai.</p>
      ) : (
        <ul className="mt-2 divide-y divide-slate-100">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-lg text-slate-900">{r.studentName.replace("(DEMO) ", "")}</p>
                <p className="text-sm text-slate-500">
                  {fmtDate(r.fromDate)}
                  {r.toDate !== r.fromDate ? ` → ${fmtDate(r.toDate)}` : ""} · {r.reason}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button disabled={busyId === r.id} onClick={() => review(r.id, "APPROVED")} className="rounded-xl bg-portal px-4 py-2 text-base font-medium text-white disabled:opacity-50">
                  Approve
                </button>
                <button disabled={busyId === r.id} onClick={() => review(r.id, "REJECTED")} className="rounded-xl border border-red-500 bg-white px-4 py-2 text-base font-medium text-red-600 disabled:opacity-50">
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
