import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const flirtMessagesTable = pgTable("flirt_messages", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull(),
  fromClerkId: text("from_clerk_id").notNull(),
  toClerkId: text("to_clerk_id").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFlirtMessageSchema = createInsertSchema(flirtMessagesTable).omit({ id: true, createdAt: true });
export type InsertFlirtMessage = z.infer<typeof insertFlirtMessageSchema>;
export type FlirtMessage = typeof flirtMessagesTable.$inferSelect;
