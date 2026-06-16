import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const userStreaksTable = pgTable("user_streaks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  currentWinStreak: integer("current_win_streak").notNull().default(0),
  longestWinStreak: integer("longest_win_streak").notNull().default(0),
  currentLoginStreak: integer("current_login_streak").notNull().default(0),
  longestLoginStreak: integer("longest_login_streak").notNull().default(0),
  gamesPlayed: integer("games_played").notNull().default(0),
  gamesWon: integer("games_won").notNull().default(0),
  gamesLost: integer("games_lost").notNull().default(0),
  lastLoginDate: text("last_login_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type UserStreak = typeof userStreaksTable.$inferSelect;
export type InsertUserStreak = typeof userStreaksTable.$inferInsert;

export const BadgeSchema = z.object({
  id: z.string(),
  emoji: z.string(),
  label: z.string(),
  description: z.string(),
});
export type Badge = z.infer<typeof BadgeSchema>;

export function computeBadges(streak: UserStreak): Badge[] {
  const badges: Badge[] = [];
  if (streak.currentWinStreak >= 3) {
    badges.push({ id: "win3", emoji: "🔥", label: "3 Win Streak", description: "Won 3 games in a row" });
  }
  if (streak.longestWinStreak >= 7) {
    badges.push({ id: "win7", emoji: "⚡", label: "7 Win Streak", description: "Won 7 games in a row at some point" });
  }
  if (streak.longestWinStreak >= 15) {
    badges.push({ id: "win15", emoji: "💫", label: "15 Win Streak", description: "Won 15 games in a row" });
  }
  if (streak.currentLoginStreak >= 7) {
    badges.push({ id: "login7", emoji: "📅", label: "7 Day Streak", description: "Logged in 7 days in a row" });
  }
  if (streak.currentLoginStreak >= 30) {
    badges.push({ id: "login30", emoji: "👑", label: "30 Day Streak", description: "Logged in 30 days in a row" });
  }
  if (streak.gamesPlayed >= 10) {
    badges.push({ id: "played10", emoji: "🎮", label: "10 Games", description: "Played 10 games total" });
  }
  if (streak.gamesPlayed >= 50) {
    badges.push({ id: "played50", emoji: "🏅", label: "50 Games", description: "Played 50 games total" });
  }
  if (streak.gamesWon >= 5) {
    badges.push({ id: "wins5", emoji: "🏆", label: "5 Wins", description: "Won 5 games total" });
  }
  if (streak.gamesWon >= 25) {
    badges.push({ id: "wins25", emoji: "💎", label: "25 Wins", description: "Won 25 games total" });
  }
  return badges;
}
