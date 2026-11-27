# AttendX: proxy-resistant attendance

Additive module. The daily `attendance` table and `/attendance/*` routes are unchanged; AttendX writes
`attx_*` tables and produces a per-session result that a teacher confirms.

## Flow
1. **Enrolment (once):** admin `POST /attendx/binding-codes` for a student and hands the code over in person.
   Student `POST /attendx/bind` with the code and an ECDSA P-256 public key (WebCrypto, non-extractable). A password alone never binds a device.
2. **Teacher:** `POST /attendx/sessions`, show `GET /attendx/sessions/:id/qr` (rotates every `qrIntervalSec`),
   `POST /attendx/sessions/:id/checks` for a room-code challenge (`CODE`) or a re-ping (`PING`), then `close`.
3. **Student:** `GET /attendx/checks/open` → `POST /attendx/checks/:id/nonce` → sign
   `attx1|checkId|nonce|qrToken|ANSWER` with the device key → `POST /attendx/checks/:id/submit`.
4. **Decision:** `GET results`, `POST confirm` (accepts PRESENT/ABSENT proposals; REVIEW rows are never auto-confirmed),
   `PUT /sessions/:id/students/:studentId/decision` (reason required, audit-logged). The teacher's `finalStatus` is the authority.

## Design rules
- Client sends evidence only. Student id comes from the JWT; outcome, flags, time are computed on the server.
- QR and GPS are **not** proof of presence. GPS is not used at all. QR only feeds the score.
- Missing a check never means ABSENT: a student with any valid signal lands in PRESENT or REVIEW.
- Secrets live in `attx_session_secrets` and are never returned by any route.
- One-time nonces, a 3-attempt cap per check, unique indexes on responses, slot uses, nonces and device keys.

## Scoring (`attendx/scoring.ts`)
Weights: INITIAL 1, CODE 2, PING 1. `score = weighted passes / total weight`. PRESENT needs a valid INITIAL,
`score >= minScore` (default 0.75) and fewer than 2 soft flags; nothing valid at all proposes ABSENT; everything else is REVIEW.

## Known limits (not solved by software)
A friend inside the room relaying the QR and code live, and a student lending their bound phone.
Mitigations: short windows, random checks, teacher spot roll-call, review queue.

## Not built yet
Teacher/student UI in `apps/web`, pair/cluster analytics, retention job for nonces, writing confirmed results into the daily `attendance` table.
