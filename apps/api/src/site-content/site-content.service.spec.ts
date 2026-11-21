import { BadRequestException, NotFoundException } from "@nestjs/common";
import { SiteContentService } from "./site-content.service";
import { AuditService } from "../common/audit.service";
import { SITE_CONTENT_DEFAULTS } from "./defaults.generated";
import { deepFill, validateAgainstDefaults } from "./site-content.shape";

describe("SiteContentService", () => {
  const service = new SiteContentService(new AuditService());

  it("serves the built-in defaults when nothing is customised", async () => {
    const c = await service.getEffective();
    expect(c.hero.welcome).toBe(SITE_CONTENT_DEFAULTS.hero.welcome);
    expect(Object.keys(c)).toEqual(Object.keys(SITE_CONTENT_DEFAULTS));
  });

  it("saves an edit, serves it publicly, flags it customised, and resets", async () => {
    const value = { ...SITE_CONTENT_DEFAULTS.hero, welcome: "Namaste" };
    await service.save("hero", value, "u1");
    expect((await service.getEffective()).hero.welcome).toBe("Namaste");
    const admin = await service.getForAdmin();
    expect(admin.sections.find((s) => s.key === "hero")!.customized).toBe(true);
    await service.reset("hero", "u1");
    expect((await service.getEffective()).hero.welcome).toBe(SITE_CONTENT_DEFAULTS.hero.welcome);
  });

  it("lets admins add and remove list items", async () => {
    const nav = SITE_CONTENT_DEFAULTS.navigation;
    const primaryNav = [...nav.primaryNav, { label: "Gallery", href: "/gallery" }];
    await service.save("navigation", { ...nav, primaryNav }, "u1");
    expect((await service.getEffective()).navigation.primaryNav).toHaveLength(nav.primaryNav.length + 1);
    await service.reset("navigation", "u1");
  });

  it("rejects wrong types, unsafe links, bad colours and unknown sections", async () => {
    await expect(service.save("hero", { ...SITE_CONTENT_DEFAULTS.hero, welcome: 5 }, "u1")).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.save("social", { instagram: "javascript:alert(1)", facebook: "", youtube: "" }, "u1")).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.save("theme", { ...SITE_CONTENT_DEFAULTS.theme, gold500: "red;} body{display:none" }, "u1")).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.save("nope", {}, "u1")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("keeps the hero first and visible on the homepage", async () => {
    const sections = [...SITE_CONTENT_DEFAULTS.homepage.sections].reverse().map((s: any) => ({ ...s, visible: false }));
    const saved = await service.save("homepage", { sections }, "u1");
    expect(saved.value.sections[0]).toMatchObject({ id: "hero", visible: true });
    expect(saved.value.sections).toHaveLength(SITE_CONTENT_DEFAULTS.homepage.sections.length);
    await service.reset("homepage", "u1");
  });
});

describe("shape helpers", () => {
  it("deepFill adds keys new in code but takes arrays whole", () => {
    expect(deepFill({ a: "x", b: "y", l: [1, 2] }, { a: "z", l: [9] })).toEqual({ a: "z", b: "y", l: [9] });
  });
  it("drops unknown keys and fills missing ones", () => {
    const issues: any[] = [];
    expect(validateAgainstDefaults({ a: "x", b: "y" }, { a: "q", evil: 1 }, "", issues)).toEqual({ a: "q", b: "y" });
    expect(issues).toEqual([]);
  });
});
