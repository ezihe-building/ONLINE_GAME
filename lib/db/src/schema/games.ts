import { pgTable, serial, integer, text, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const gameSessionsTable = pgTable("game_sessions", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").notNull(),
  gameType: text("game_type").notNull(),
  playerXClerkId: text("player_x_clerk_id").notNull(),
  playerOClerkId: text("player_o_clerk_id").notNull(),
  currentTurnClerkId: text("current_turn_clerk_id").notNull(),
  winnerClerkId: text("winner_clerk_id"),
  isDraw: boolean("is_draw").notNull().default(false),
  status: text("status").notNull().default("active"),
  state: jsonb("state").notNull().default({}),
  flirtSent: boolean("flirt_sent").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
});

export const insertGameSessionSchema = createInsertSchema(gameSessionsTable).omit({ id: true, createdAt: true });
export type InsertGameSession = z.infer<typeof insertGameSessionSchema>;
export type GameSession = typeof gameSessionsTable.$inferSelect;

export const gameMovesTable = pgTable("game_moves", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull(),
  playerClerkId: text("player_clerk_id").notNull(),
  moveData: jsonb("move_data").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertGameMoveSchema = createInsertSchema(gameMovesTable).omit({ id: true, createdAt: true });
export type InsertGameMove = z.infer<typeof insertGameMoveSchema>;
export type GameMove = typeof gameMovesTable.$inferSelect;
