import { Router } from "express";
import { db, usersTable, gameSessionsTable, flirtMessagesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { SendFlirtMessageBody, SendFlirtMessageParams, GetFlirtMessageParams } from "@workspace/api-zod";
import { formatUser } from "./rooms";

const router = Router();

function requireAuth(req: any, res: any): number | null {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return null;
  }
  return req.session.userId;
}

// POST /games/:gameId/flirt
router.post("/games/:gameId/flirt", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const params = SendFlirtMessageParams.safeParse({ gameId: parseInt(req.params.gameId, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid game ID" }); return; }

  const body = SendFlirtMessageBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: "Invalid message" }); return; }

  const [game] = await db
    .select()
    .from(gameSessionsTable)
    .where(eq(gameSessionsTable.id, params.data.gameId))
    .limit(1);

  if (!game) { res.status(404).json({ error: "Game not found" }); return; }
  if (game.status !== "finished") { res.status(400).json({ error: "Game is not finished" }); return; }
  if (game.isDraw) { res.status(400).json({ error: "It was a draw — no flirt needed" }); return; }
  if (game.winnerUserId === userId) { res.status(400).json({ error: "Winners don't send flirts" }); return; }
  if (game.playerXUserId !== userId && game.playerOUserId !== userId) {
    res.status(400).json({ error: "You are not a player in this game" }); return;
  }
  if (game.flirtSent) { res.status(400).json({ error: "Flirt already sent" }); return; }

  const [msg] = await db
    .insert(flirtMessagesTable)
    .values({ gameId: game.id, fromUserId: userId, message: body.data.message })
    .returning();

  await db
    .update(gameSessionsTable)
    .set({ flirtSent: true })
    .where(eq(gameSessionsTable.id, game.id));

  const [fromUser] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  res.status(201).json({
    id: msg.id,
    gameId: msg.gameId,
    fromUserId: msg.fromUserId,
    fromProfile: fromUser ? formatUser(fromUser) : undefined,
    message: msg.message,
    createdAt: msg.createdAt.toISOString(),
  });
});

// GET /games/:gameId/flirt
router.get("/games/:gameId/flirt", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const params = GetFlirtMessageParams.safeParse({ gameId: parseInt(req.params.gameId, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid game ID" }); return; }

  const [msg] = await db
    .select()
    .from(flirtMessagesTable)
    .where(eq(flirtMessagesTable.gameId, params.data.gameId))
    .limit(1);

  if (!msg) { res.status(404).json({ error: "No flirt message yet" }); return; }

  const [fromUser] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, msg.fromUserId))
    .limit(1);

  res.json({
    id: msg.id,
    gameId: msg.gameId,
    fromUserId: msg.fromUserId,
    fromProfile: fromUser ? formatUser(fromUser) : undefined,
    message: msg.message,
    createdAt: msg.createdAt.toISOString(),
  });
});

export default router;
