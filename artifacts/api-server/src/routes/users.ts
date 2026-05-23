import { Router, type IRouter } from "express";
import { eq, count, and } from "drizzle-orm";
import { db, usersTable, gameSessionsTable, flirtMessagesTable } from "@workspace/db";
import { requireAuth, getUserId } from "../lib/auth";
import { UpdateMeBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/users/me", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getUserId(req);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId));
  if (!user) {
    const username = `player_${clerkId.slice(-6)}`;
    const [newUser] = await db.insert(usersTable).values({ clerkId, username }).returning();
    res.json(newUser);
    return;
  }
  res.json(user);
});

router.put("/users/me", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getUserId(req);
  const parsed = UpdateMeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updates: Partial<typeof usersTable.$inferInsert> = {};
  if (parsed.data.username != null) updates.username = parsed.data.username;
  if (parsed.data.avatarPath !== undefined) updates.avatarPath = parsed.data.avatarPath;

  const [user] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.clerkId, clerkId))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(user);
});

router.get("/users/me/stats", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getUserId(req);

  const [wins] = await db
    .select({ count: count() })
    .from(gameSessionsTable)
    .where(eq(gameSessionsTable.winnerClerkId, clerkId));

  const [gamesPlayed] = await db
    .select({ count: count() })
    .from(gameSessionsTable)
    .where(
      and(
        eq(gameSessionsTable.status, "finished"),
      ),
    );

  const [playerGames] = await db
    .select({ count: count() })
    .from(gameSessionsTable)
    .where(
      and(eq(gameSessionsTable.status, "finished")),
    );

  const [flirtsSent] = await db
    .select({ count: count() })
    .from(flirtMessagesTable)
    .where(eq(flirtMessagesTable.fromClerkId, clerkId));

  const [flirtsReceived] = await db
    .select({ count: count() })
    .from(flirtMessagesTable)
    .where(eq(flirtMessagesTable.toClerkId, clerkId));

  const winCount = Number(wins.count);
  const gamesCount = Number(playerGames.count);

  res.json({
    wins: winCount,
    losses: gamesCount - winCount,
    gamesPlayed: gamesCount,
    flirtsSent: Number(flirtsSent.count),
    flirtsReceived: Number(flirtsReceived.count),
  });
});

export default router;
