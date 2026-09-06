import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { db, schema } from "@nalanda/database";
import { AuditService } from "../common/audit.service";
import type { CreateCouponDto, UpdateCouponDto } from "@nalanda/shared";

@Injectable()
export class StoreCouponsService {
  constructor(private readonly auditService: AuditService) {}

  list() {
    return db.select().from(schema.storeCoupons);
  }

  async create(dto: CreateCouponDto, actorId: string) {
    const code = dto.code.toUpperCase();
    const [existing] = await db.select().from(schema.storeCoupons).where(eq(schema.storeCoupons.code, code));
    if (existing) throw new BadRequestException("A coupon with this code already exists");

    const [row] = await db
      .insert(schema.storeCoupons)
      .values({
        code,
        description: dto.description,
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        minOrderAmount: dto.minOrderAmount,
        maxUses: dto.maxUses,
        validFrom: dto.validFrom,
        validUntil: dto.validUntil,
      })
      .returning();
    await this.auditService.log({ userId: actorId, action: "STORE_COUPON_CREATE", entity: "StoreCoupon", entityId: row.id });
    return row;
  }

  async update(id: string, dto: UpdateCouponDto, actorId: string) {
    const [existing] = await db.select().from(schema.storeCoupons).where(eq(schema.storeCoupons.id, id));
    if (!existing) throw new NotFoundException("Coupon not found");

    const [row] = await db
      .update(schema.storeCoupons)
      .set({ ...dto, updatedAt: new Date().toISOString() })
      .where(eq(schema.storeCoupons.id, id))
      .returning();
    await this.auditService.log({ userId: actorId, action: "STORE_COUPON_UPDATE", entity: "StoreCoupon", entityId: id });
    return row;
  }
}
