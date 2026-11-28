import { BadRequestException, Body, Controller, Get, Injectable, Module, NotFoundException, Param, Post, Req, Res, UseGuards } from "@nestjs/common";
import type { Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@nalanda/database";
import { AuditService } from "../common/audit.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import type { AuthenticatedUser } from "../common/types/authenticated-user";

/** Settings-table key prefix for uploaded images (hidden from the Settings list). */
export const MEDIA_PREFIX = "media:";
export const MAX_IMAGE_BYTES = 2.5 * 1024 * 1024;

/** Only raster formats we can verify by magic bytes. SVG is refused on purpose (it can carry script). */
export function sniffImageType(buf: Buffer): "image/png" | "image/jpeg" | "image/webp" | "image/gif" | null {
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.length > 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  if (buf.length > 6 && (buf.toString("ascii", 0, 6) === "GIF87a" || buf.toString("ascii", 0, 6) === "GIF89a")) return "image/gif";
  return null;
}

@Injectable()
export class MediaService {
  constructor(private readonly auditService: AuditService) {}

  async upload(dataBase64: string, actorId: string) {
    const clean = dataBase64.replace(/^data:[^;]+;base64,/, "");
    const buf = Buffer.from(clean, "base64");
    if (buf.length === 0) throw new BadRequestException("Empty image");
    if (buf.length > MAX_IMAGE_BYTES) throw new BadRequestException("Image is too large (max 2.5 MB). Please compress it first.");
    const mime = sniffImageType(buf);
    if (!mime) throw new BadRequestException("Only PNG, JPG, WEBP or GIF images are allowed.");
    const id = randomUUID();
    await db.insert(schema.settings).values({ key: MEDIA_PREFIX + id, value: JSON.stringify({ mime, data: buf.toString("base64") }) });
    await this.auditService.log({ userId: actorId, action: "MEDIA_UPLOAD", entity: "Media", entityId: id });
    return { id, mime, size: buf.length };
  }

  async get(id: string) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new NotFoundException();
    const [row] = await db.select().from(schema.settings).where(eq(schema.settings.key, MEDIA_PREFIX + id));
    if (!row) throw new NotFoundException();
    try {
      const { mime, data } = JSON.parse(row.value);
      return { mime: mime as string, buf: Buffer.from(data, "base64") };
    } catch {
      throw new NotFoundException();
    }
  }
}

const uploadSchema = z.object({ data: z.string().min(1) });

@Controller("media")
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  async upload(@Body(new ZodValidationPipe(uploadSchema)) dto: { data: string }, @CurrentUser() user: AuthenticatedUser, @Req() req: Request) {
    const r = await this.media.upload(dto.data, user.sub);
    const proto = (req.headers["x-forwarded-proto"] as string | undefined)?.split(",")[0] ?? req.protocol;
    const url = `${proto}://${req.get("host")}/api/media/${r.id}`;
    return { ...r, url };
  }

  // PUBLIC: images published on the website. Ids are unguessable UUIDs.
  @Get(":id")
  async serve(@Param("id") id: string, @Res() res: Response) {
    const { mime, buf } = await this.media.get(id);
    res.set({
      "Content-Type": mime,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "Cross-Origin-Resource-Policy": "cross-origin",
    });
    res.send(buf);
  }
}

@Module({ controllers: [MediaController], providers: [MediaService] })
export class MediaModule {}
