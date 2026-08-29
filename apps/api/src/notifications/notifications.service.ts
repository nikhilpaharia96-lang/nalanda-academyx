import { Injectable } from "@nestjs/common";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db, schema } from "@nalanda/database";

@Injectable()
export class NotificationsService {
  async notify(recipientUserId: string, title: string, message: string, type: string) {
    const [row] = await db.insert(schema.notifications).values({ recipientUserId, title, message, type }).returning();
    return row;
  }

  async listForUser(userId: string, unreadOnly = false) {
    const conditions = [eq(schema.notifications.recipientUserId, userId)];
    if (unreadOnly) conditions.push(isNull(schema.notifications.readAt));
    return db
      .select()
      .from(schema.notifications)
      .where(and(...conditions))
      .orderBy(desc(schema.notifications.createdAt));
  }

  async markRead(id: string, userId: string) {
    await db
      .update(schema.notifications)
      .set({ readAt: new Date().toISOString() })
      .where(and(eq(schema.notifications.id, id), eq(schema.notifications.recipientUserId, userId)));
    return { success: true };
  }
}
