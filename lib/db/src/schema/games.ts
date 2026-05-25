import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { roomsTable } from "./rooms";

export const gameSessionsTable = pgTable("game_sessions", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id")
    .notNull()
    .references(() => roomsTable.id),
  gameType: text("game_type").notNull(),
  status: text("status").notNull().default("active"),
  playerXUserId: integer("player_x_user_id")
    .notNull()
    .references(() => usersTable.id),
  playerOUserId: integer("player_o_user_id")
    .notNull()
    .references(() => usersTable.id),
  currentTurnUserId: integer("current_turn_user_id").references(
    () => usersTable.id,
  ),
  winnerUserId: integer("winner_user_id").references(() => usersTable.id),
  isDraw: boolean("is_draw").notNull().default(false),
  boardState: jsonb("board_state").notNull().default({}),
  flirtSent: boolean("flirt_sent").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  finishedAt: timestamp("finished_at"),
});

export const flirtMessagesTable = pgTable("flirt_messages", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id")
    .notNull()
    .references(() => gameSessionsTable.id),
  fromUserId: integer("from_user_id")
    .notNull()
    .references(() => usersTable.id),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type GameSession = typeof gameSessionsTable.$inferSelect;
export type FlirtMessage = typeof flirtMessagesTable.$inferSelect;
