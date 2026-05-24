import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, flirtMessagesTable, gameSessionsTable, usersTable } from "@workspace/db";
import { requireAuth, getUserId } from "../lib/auth";
import { GetFlirtMessageParams, SendFlirtMessageParams, SendFlirtMessageBody } from "@workspace/api-zod";

const router: IRouter = Router();

async function getProfile(userId: number) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) return undefined;
  const { passwordHash: _ph, ...safe } = user;
  return safe ?? undefined;
}

router.get("/games/:gameId/flirt", requireAuth, async (req, res): Promise<void> => {
  const params = GetFlirtMessageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [msg] = await db
    .select()
    .from(flirtMessagesTable)
    .where(eq(flirtMessagesTable.gameId, params.data.gameId));
  if (!msg) {
    res.status(404).json({ error: "No flirt message yet" });
    return;
  }
  const [fromProfile, toProfile] = await Promise.all([
    getProfile(msg.fromUserId),
    getProfile(msg.toUserId),
  ]);
  res.json({ ...msg, fromProfile, toProfile });
});

router.post("/games/:gameId/flirt", requireAuth, async (req, res): Promise<void> => {
  const params = SendFlirtMessageParams.safeParse(req.params);
  const body = SendFlirtMessageBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const userId = getUserId(req);
  const [session] = await db
    .select()
    .from(gameSessionsTable)
    .where(eq(gameSessionsTable.id, params.data.gameId));

  if (!session) {
    res.status(404).json({ error: "Game not found" });
    return;
  }
  if (session.status !== "finished") {
    res.status(400).json({ error: "Game is not finished yet" });
    return;
  }
  if (!session.winnerUserId) {
    res.status(400).json({ error: "No winner in this game" });
    return;
  }
  if (userId === session.winnerUserId) {
    res.status(400).json({ error: "Only the loser can send the flirt message" });
    return;
  }

  const toUserId = session.winnerUserId;
  const [existing] = await db
    .select()
    .from(flirtMessagesTable)
    .where(eq(flirtMessagesTable.gameId, params.data.gameId));
  if (existing) {
    res.status(400).json({ error: "Flirt message already sent" });
    return;
  }

  const [msg] = await db
    .insert(flirtMessagesTable)
    .values({
      gameId: params.data.gameId,
      fromUserId: userId,
      toUserId,
      message: body.data.message,
    })
    .returning();

  await db
    .update(gameSessionsTable)
    .set({ flirtSent: true })
    .where(eq(gameSessionsTable.id, params.data.gameId));

  const [fromProfile, toProfile] = await Promise.all([
    getProfile(msg.fromUserId),
    getProfile(msg.toUserId),
  ]);
  res.status(201).json({ ...msg, fromProfile, toProfile });
});

export default router;
