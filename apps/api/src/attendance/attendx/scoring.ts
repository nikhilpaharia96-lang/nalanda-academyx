// The AttendX verification algorithm. Pure and deterministic.
//
// Principles: the software PROPOSES, the teacher DECIDES. A student with at least one valid signal is never
// proposed ABSENT, so a dead battery or a bad network leads to REVIEW, not a lost mark.
// GPS is deliberately absent: it is not accepted as evidence of presence.

export type CheckKind = "INITIAL" | "CODE" | "PING";
export type Outcome = "PASS" | "LATE_OK" | "MISSED";
export type Proposed = "PRESENT" | "ABSENT" | "REVIEW";

export interface CheckInput { id: string; kind: CheckKind; weight: number }

export const CHECK_WEIGHTS: Record<CheckKind, number> = { INITIAL: 1, CODE: 2, PING: 1 };
const OUTCOME_VALUE: Record<Outcome, number> = { PASS: 1, LATE_OK: 0.5, MISSED: 0 };

export interface ScoreResult { proposed: Proposed; score: number; flags: string[] }

export function scoreStudent(
  checks: CheckInput[],
  outcomes: Record<string, Outcome | undefined>,
  flags: string[],
  minScore: number,
): ScoreResult {
  const unique = [...new Set(flags)].sort();
  const total = checks.reduce((s, c) => s + c.weight, 0);
  const got = checks.reduce((s, c) => s + c.weight * OUTCOME_VALUE[outcomes[c.id] ?? "MISSED"], 0);
  const score = total === 0 ? 0 : Math.round((got / total) * 1000) / 1000;

  const valid = (id: string) => outcomes[id] === "PASS" || outcomes[id] === "LATE_OK";
  const initial = checks.find((c) => c.kind === "INITIAL");
  const initialValid = !!initial && valid(initial.id);
  const anySignal = checks.some((c) => valid(c.id));

  let proposed: Proposed;
  if (!anySignal) proposed = "ABSENT"; // nothing at all reached the server
  else if (initialValid && score >= minScore && unique.length < 2) proposed = "PRESENT";
  else proposed = "REVIEW";
  return { proposed, score, flags: unique };
}
