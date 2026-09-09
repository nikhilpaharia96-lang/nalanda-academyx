import { NotFoundException } from "@nestjs/common";
import { EventsService } from "./events.service";
import { AuditService } from "../common/audit.service";

// `db`/`schema` are re-resolved fresh here (rather than imported at module
// top-level) is unnecessary since jest's setupFiles already pointed
// DATABASE_URL at a fresh, migrated temp SQLite file before this file's
// imports ran (see test/setup.ts) — a plain top-level import is enough.
import { db, schema } from "@nalanda/database";
import { eq } from "drizzle-orm";

describe("EventsService", () => {
  const service = new EventsService(new AuditService());
  const actorId = "admin-1";

  afterEach(async () => {
    await db.delete(schema.events);
  });

  it("creates an event with a slug and default displayOrder", async () => {
    const event = await service.create(
      { title: "Annual Sports Day", description: "Track & field", category: "Sports", date: "2027-01-15" },
      actorId,
    );
    expect(event.slug).toMatch(/^annual-sports-day-/);
    expect(event.published).toBe(false);
    expect(event.displayOrder).toBe(0);
  });

  it("supports the full set of new admin-controlled fields", async () => {
    const event = await service.create(
      {
        title: "Science Exhibition",
        description: "Student projects",
        category: "Academic",
        date: "2027-02-01",
        time: "10:00",
        endTime: "16:00",
        location: "Main Hall",
        registrationUrl: "https://example.com/register",
        ctaText: "Register Now",
        displayOrder: 2,
      },
      actorId,
    );
    expect(event.endTime).toBe("16:00");
    expect(event.registrationUrl).toBe("https://example.com/register");
    expect(event.ctaText).toBe("Register Now");
    expect(event.displayOrder).toBe(2);
  });

  it("only returns published events on the public (includeUnpublished: false) path", async () => {
    await service.create({ title: "Draft Event", description: "d", category: "General", date: "2027-03-01" }, actorId);
    const [published] = await db.select().from(schema.events);
    await service.setPublished(published.id, true, actorId);
    await service.create({ title: "Still Draft", description: "d", category: "General", date: "2027-03-02" }, actorId);

    const publicList = await service.list({ includeUnpublished: false });
    expect(publicList).toHaveLength(1);
    expect(publicList[0].title).toBe("Draft Event");

    const adminList = await service.list({ includeUnpublished: true });
    expect(adminList).toHaveLength(2);
  });

  it("sorts upcoming events with the nearest date first", async () => {
    await service.create({ title: "Later Event", description: "d", category: "General", date: "2027-06-01" }, actorId);
    await service.create({ title: "Sooner Event", description: "d", category: "General", date: "2027-05-01" }, actorId);
    await service.create({ title: "Soonest Event", description: "d", category: "General", date: "2027-04-01" }, actorId);

    const list = await service.list({ includeUnpublished: true });
    expect(list.map((e) => e.title)).toEqual(["Soonest Event", "Sooner Event", "Later Event"]);
  });

  it("updates an event", async () => {
    const created = await service.create({ title: "Old Title", description: "d", category: "General", date: "2027-07-01" }, actorId);
    const updated = await service.update(created.id, { title: "New Title", ctaText: "Learn More" }, actorId);
    expect(updated.title).toBe("New Title");
    expect(updated.ctaText).toBe("Learn More");
  });

  it("throws NotFoundException when updating a non-existent event", async () => {
    await expect(service.update("does-not-exist", { title: "x" }, actorId)).rejects.toThrow(NotFoundException);
  });

  it("toggles publish state", async () => {
    const created = await service.create({ title: "Toggle Me", description: "d", category: "General", date: "2027-08-01" }, actorId);
    expect(created.published).toBe(false);
    const published = await service.setPublished(created.id, true, actorId);
    expect(published.published).toBe(true);
    const unpublished = await service.setPublished(created.id, false, actorId);
    expect(unpublished.published).toBe(false);
  });

  it("deletes an event", async () => {
    const created = await service.create({ title: "Delete Me", description: "d", category: "General", date: "2027-09-01" }, actorId);
    await service.remove(created.id, actorId);
    const [row] = await db.select().from(schema.events).where(eq(schema.events.id, created.id));
    expect(row).toBeUndefined();
  });

  it("throws NotFoundException when deleting a non-existent event", async () => {
    await expect(service.remove("does-not-exist", actorId)).rejects.toThrow(NotFoundException);
  });

  it("hides unpublished events from getBySlug for non-admins but shows them to admins", async () => {
    const created = await service.create({ title: "Hidden Event", description: "d", category: "General", date: "2027-10-01" }, actorId);
    await expect(service.getBySlug(created.slug, false)).rejects.toThrow(NotFoundException);
    const asAdmin = await service.getBySlug(created.slug, true);
    expect(asAdmin.id).toBe(created.id);
  });
});
