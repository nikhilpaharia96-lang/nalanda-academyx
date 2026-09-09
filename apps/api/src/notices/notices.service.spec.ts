import { NotFoundException } from "@nestjs/common";
import { NoticesService } from "./notices.service";
import { AuditService } from "../common/audit.service";
import { db, schema } from "@nalanda/database";
import { eq } from "drizzle-orm";

describe("NoticesService", () => {
  const service = new NoticesService(new AuditService());
  const actorId = "admin-1";

  afterEach(async () => {
    await db.delete(schema.notices);
  });

  it("creates a notice with a slug and a default noticeDate", async () => {
    const notice = await service.create({ title: "Admission Open 2027-28", content: "Apply now", category: "Admission" }, actorId);
    expect(notice.slug).toMatch(/^admission-open-2027-28-/);
    expect(notice.published).toBe(false);
    expect(notice.noticeDate).toBeTruthy();
    expect(notice.displayOrder).toBe(0);
  });

  it("supports the full set of new admin-controlled fields", async () => {
    const notice = await service.create(
      {
        title: "Half Yearly Exam Datesheet",
        content: "See attached",
        category: "Examination",
        attachmentUrl: "https://example.com/datesheet.pdf",
        externalLink: "https://example.com/portal",
        ctaText: "Download Datesheet",
        noticeDate: "2027-01-05",
        displayOrder: 3,
      },
      actorId,
    );
    expect(notice.attachmentUrl).toBe("https://example.com/datesheet.pdf");
    expect(notice.externalLink).toBe("https://example.com/portal");
    expect(notice.ctaText).toBe("Download Datesheet");
    expect(notice.noticeDate).toBe("2027-01-05");
    expect(notice.displayOrder).toBe(3);
  });

  it("only returns published notices on the public (includeUnpublished: false) path", async () => {
    await service.create({ title: "Published Notice", content: "c", category: "General", noticeDate: "2027-01-01" }, actorId);
    const [row] = await db.select().from(schema.notices);
    await service.setPublished(row.id, true, actorId);
    await service.create({ title: "Draft Notice", content: "c", category: "General", noticeDate: "2027-01-02" }, actorId);

    const publicList = await service.list({ includeUnpublished: false });
    expect(publicList).toHaveLength(1);
    expect(publicList[0].title).toBe("Published Notice");

    const adminList = await service.list({ includeUnpublished: true });
    expect(adminList).toHaveLength(2);
  });

  it("sorts notices newest-first by noticeDate", async () => {
    await service.create({ title: "Oldest", content: "c", category: "General", noticeDate: "2027-01-01" }, actorId);
    await service.create({ title: "Newest", content: "c", category: "General", noticeDate: "2027-03-01" }, actorId);
    await service.create({ title: "Middle", content: "c", category: "General", noticeDate: "2027-02-01" }, actorId);

    const list = await service.list({ includeUnpublished: true });
    expect(list.map((n) => n.title)).toEqual(["Newest", "Middle", "Oldest"]);
  });

  it("filters by search text across title and content", async () => {
    await service.create({ title: "Sports Meet Rescheduled", content: "n/a", category: "Event", noticeDate: "2027-01-01" }, actorId);
    await service.create({ title: "Fee Reminder", content: "Sports fee waiver for meet participants", category: "General", noticeDate: "2027-01-02" }, actorId);
    await service.create({ title: "Unrelated", content: "n/a", category: "General", noticeDate: "2027-01-03" }, actorId);

    const results = await service.list({ includeUnpublished: true, search: "sports" });
    expect(results.map((n) => n.title).sort()).toEqual(["Fee Reminder", "Sports Meet Rescheduled"]);
  });

  it("updates a notice", async () => {
    const created = await service.create({ title: "Old Title", content: "c", category: "General" }, actorId);
    const updated = await service.update(created.id, { title: "New Title", ctaText: "Read More" }, actorId);
    expect(updated.title).toBe("New Title");
    expect(updated.ctaText).toBe("Read More");
  });

  it("throws NotFoundException when updating a non-existent notice", async () => {
    await expect(service.update("does-not-exist", { title: "x" }, actorId)).rejects.toThrow(NotFoundException);
  });

  it("toggles publish state and stamps publishedAt", async () => {
    const created = await service.create({ title: "Toggle Me", content: "c", category: "General" }, actorId);
    expect(created.published).toBe(false);
    expect(created.publishedAt).toBeNull();
    const published = await service.setPublished(created.id, true, actorId);
    expect(published.published).toBe(true);
    expect(published.publishedAt).toBeTruthy();
  });

  it("deletes a notice", async () => {
    const created = await service.create({ title: "Delete Me", content: "c", category: "General" }, actorId);
    await service.remove(created.id, actorId);
    const [row] = await db.select().from(schema.notices).where(eq(schema.notices.id, created.id));
    expect(row).toBeUndefined();
  });

  it("throws NotFoundException when deleting a non-existent notice", async () => {
    await expect(service.remove("does-not-exist", actorId)).rejects.toThrow(NotFoundException);
  });

  it("hides unpublished notices from getBySlug for non-admins but shows them to admins", async () => {
    const created = await service.create({ title: "Hidden Notice", content: "c", category: "General" }, actorId);
    await expect(service.getBySlug(created.slug, false)).rejects.toThrow(NotFoundException);
    const asAdmin = await service.getBySlug(created.slug, true);
    expect(asAdmin.id).toBe(created.id);
  });
});
