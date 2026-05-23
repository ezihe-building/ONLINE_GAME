import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, flirtMessagesTable, gameSessionsTable, usersTable } from "@workspace/db";
import { requireAuth, getUserId } from "../lib/auth";
import { GetFlirtMessageParams, SendFlirtMessageParams, SendFlirtMessageBody } from "@workspace/api-zod";

const router: IRouter = Router();

async function getProfile(clerkId: string) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId));
  return user ?? undefined;
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
    getProfile(msg.fromClerkId),
    getProfile(msg.toClerkId),
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
  const clerkId = getUserId(req);
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
  if (!session.winnerClerkId) {
    res.status(400).json({ error: "No winner in this game" });
    return;
  }
  if (clerkId === session.winnerClerkId) {
    res.status(400).json({ error: "Only the loser can send the flirt message" });
    return;
  }

  const toClerkId = session.winnerClerkId;
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
      fromClerkId: clerkId,
      toClerkId,
      message: body.data.message,
    })
    .returning();

  await db
    .update(gameSessionsTable)
    .set({ flirtSent: true })
    .where(eq(gameSessionsTable.id, params.data.gameId));

  const [fromProfile, toProfile] = await Promise.all([
    getProfile(msg.fromClerkId),
    getProfile(msg.toClerkId),
  ]);
  res.status(201).json({ ...msg, fromProfile, toProfile });
});

export default router;
