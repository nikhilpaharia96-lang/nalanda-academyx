# Website Content (admin-editable public site)

Admins can change almost everything on the public website from
**Admin panel → Website Content** (`/admin/website`) — no code change or
redeploy. Changes appear on the public site within ~30 seconds.

## What's editable

Site name/tagline/logo, brand colours, contact details, social links, menus,
homepage layout (show/hide/reorder blocks), hero banner + photo carousel,
About + principal's message, Academics, Campus & facilities, Faculty/Events/
Notices page copy, Admission page, Get-in-touch section and Footer.

Events, notices, faculty profiles and results *entries* keep their own admin
pages; Website Content only covers their page headings/copy.

Images are **links** (https://… or a site path like `/images/…`). There is no
file-upload storage yet; host images anywhere and paste the link.

## How it works

- Each section is stored as JSON in the existing `settings` table under
  `site_content:<section>` — **no migration needed**.
- `GET /api/site-content` (public) → defaults + saved edits. `GET /api/site-content/admin`,
  `PUT|DELETE /api/site-content/:section` → SUPER_ADMIN / ADMIN only, audited.
- Saves are validated against the shape of the built-in defaults (types, list
  sizes, no `javascript:`/`data:` links, colours must be real CSS colours).
- The public site (`lib/services/siteContentService.ts`) layers the API content
  over `lib/content/*.ts`; if the API is unset/down it shows the built-in content.
- "Reset to original" deletes a section's saved edits.

## Developer note: adding or changing editable copy

The editor is generated from the *shape of the defaults*, so a new field is
editable automatically. After changing `apps/public-site/lib/content/*.ts` or
`lib/content/siteContent.ts`, refresh the API's snapshot:

```bash
npm run export:site-defaults
```

(Commit `apps/api/src/site-content/defaults.generated.ts`.) Client components
read content with `useSiteContent()`, server components with `await getSiteContent()`.
