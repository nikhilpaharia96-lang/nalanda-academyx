"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { FacultyCard } from "@/components/cards/FacultyCard";
import { StaggerGroup, FadeUp } from "@/components/motion/Reveal";
import type { FacultyMember } from "@/lib/types";

export function FacultyDirectory({ faculty }: { faculty: FacultyMember[] }) {
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("All");
  const [subject, setSubject] = useState("All");

  const departments = ["All", ...Array.from(new Set(faculty.map((f) => f.department)))];
  const subjects = ["All", ...Array.from(new Set(faculty.map((f) => f.subject)))];

  const filtered = useMemo(() => {
    return faculty.filter((f) => {
      const matchesQuery =
        query.trim() === "" ||
        f.name.toLowerCase().includes(query.toLowerCase()) ||
        f.subject.toLowerCase().includes(query.toLowerCase());
      const matchesDept = department === "All" || f.department === department;
      const matchesSubject = subject === "All" || f.subject === subject;
      return matchesQuery && matchesDept && matchesSubject;
    });
  }, [faculty, query, department, subject]);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or subject"
            className="focus-ring w-full rounded-[var(--radius-md)] border border-line bg-white py-3 pl-11 pr-4 text-sm text-navy-950 placeholder:text-slate-400"
          />
        </div>
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="focus-ring rounded-[var(--radius-md)] border border-line bg-white px-4 py-3 text-sm text-navy-950"
          aria-label="Filter by department"
        >
          {departments.map((d) => (
            <option key={d} value={d}>
              {d === "All" ? "All Departments" : d}
            </option>
          ))}
        </select>
        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="focus-ring rounded-[var(--radius-md)] border border-line bg-white px-4 py-3 text-sm text-navy-950"
          aria-label="Filter by subject"
        >
          {subjects.map((s) => (
            <option key={s} value={s}>
              {s === "All" ? "All Subjects" : s}
            </option>
          ))}
        </select>
      </div>

      {filtered.length > 0 ? (
        <StaggerGroup className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((member) => (
            <FadeUp key={member.id}>
              <FacultyCard member={member} />
            </FadeUp>
          ))}
        </StaggerGroup>
      ) : (
        <p className="mt-10 rounded-[var(--radius-lg)] border border-dashed border-line p-10 text-center text-sm text-slate-500">
          Faculty information will be updated soon.
        </p>
      )}
    </div>
  );
}
