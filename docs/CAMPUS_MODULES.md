# Campus modules (ported from LAV_SMS concepts)

New API modules, all under the existing JWT + role guards. Mutations are ADMIN/SUPER_ADMIN only.

| Module | Base path | Who can read |
|---|---|---|
| Timetable | `/timetable` (slots, entries, `class/:c/section/:s`, `student/:id`, `teacher`) | Admin, assigned Teacher, Student/Parent (own/linked child) |
| Library | `/library` (books, requests: create → issue → return / reject / cancel) | Catalogue: any logged-in user. Requests: Admin all, Student own, Parent linked children |
| Hostel | `/hostels` (hostels, allocations, residents, `student/:id`) | Admin; Student/Parent for own/linked child allocation |
| Promotions | `/promotions` (candidates, batch promote, `student/:id` history) | Admin; history per student ownership rules |

Design notes
- Book copies use an atomic conditional UPDATE, so concurrent issues can never push `available_copies` below 0.
- Timetable rejects a teacher being scheduled in two classes in the same slot.
- Promotion is a batch with per-student results, only acts on students still in `fromAcademicYearId` (re-submitting is harmless), and keeps an audit trail in `promotions`.
- Migrations `0006_*` (SQLite and Postgres) are additive only: 7 new tables, no changes to existing ones.
- Not included (needs UI + auth changes): Librarian/Accountant roles, web portal screens for these modules.
