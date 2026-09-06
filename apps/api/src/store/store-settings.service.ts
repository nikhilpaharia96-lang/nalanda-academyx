import { Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { db, schema } from "@nalanda/database";
import { AuditService } from "../common/audit.service";
import type { UpdateStoreSettingsDto } from "@nalanda/shared";

const KEYS = {
  pickupAvailable: "store_pickup_available",
  deliveryAvailable: "store_delivery_available",
  pickupInstructions: "store_pickup_instructions",
  contactPhone: "store_contact_phone",
  contactEmail: "store_contact_email",
  collectionHours: "store_collection_hours",
  deliveryFee: "store_delivery_fee",
} as const;

@Injectable()
export class StoreSettingsService {
  constructor(private readonly auditService: AuditService) {}

  /** Sensible, honest defaults: pickup is on (this project explicitly does
   * not assume a delivery/logistics capability exists — spec §11), delivery
   * is off, and no delivery fee is invented until Admin configures one. */
  async get() {
    const rows = await db.select().from(schema.settings);
    const byKey = new Map(rows.map((r) => [r.key, r.value]));

    return {
      pickupAvailable: byKey.has(KEYS.pickupAvailable) ? byKey.get(KEYS.pickupAvailable) === "true" : true,
      deliveryAvailable: byKey.has(KEYS.deliveryAvailable) ? byKey.get(KEYS.deliveryAvailable) === "true" : false,
      pickupInstructions: byKey.get(KEYS.pickupInstructions) ?? "Collect from the School Store counter during office hours.",
      contactPhone: byKey.get(KEYS.contactPhone) ?? "",
      contactEmail: byKey.get(KEYS.contactEmail) ?? "",
      collectionHours: byKey.get(KEYS.collectionHours) ?? "Mon–Sat, 9:00 AM – 3:00 PM",
      deliveryFee: byKey.has(KEYS.deliveryFee) ? Number(byKey.get(KEYS.deliveryFee)) : 0,
    };
  }

  private async setKey(key: string, value: string) {
    const [existing] = await db.select().from(schema.settings).where(eq(schema.settings.key, key));
    if (existing) {
      await db.update(schema.settings).set({ value }).where(eq(schema.settings.key, key));
    } else {
      await db.insert(schema.settings).values({ key, value });
    }
  }

  async update(dto: UpdateStoreSettingsDto, actorId: string) {
    if (dto.pickupAvailable !== undefined) await this.setKey(KEYS.pickupAvailable, String(dto.pickupAvailable));
    if (dto.deliveryAvailable !== undefined) await this.setKey(KEYS.deliveryAvailable, String(dto.deliveryAvailable));
    if (dto.pickupInstructions !== undefined) await this.setKey(KEYS.pickupInstructions, dto.pickupInstructions);
    if (dto.contactPhone !== undefined) await this.setKey(KEYS.contactPhone, dto.contactPhone);
    if (dto.contactEmail !== undefined) await this.setKey(KEYS.contactEmail, dto.contactEmail);
    if (dto.collectionHours !== undefined) await this.setKey(KEYS.collectionHours, dto.collectionHours);
    if (dto.deliveryFee !== undefined) await this.setKey(KEYS.deliveryFee, String(dto.deliveryFee));

    await this.auditService.log({ userId: actorId, action: "STORE_SETTINGS_UPDATE", entity: "StoreSettings" });
    return this.get();
  }
}
