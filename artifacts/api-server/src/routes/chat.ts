import { Router } from "express";
import { db, chatMessagesTable, usersTable } from "@workspace/db";
import { eq, asc, inArray } from "drizzle-orm";

const router = Router();

function requireAuth(req: any, res: any): number | null {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return null;
  }
  return req.session.userId;
}

function formatUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    username: user.username,
    avatarPath: user.avatarPath ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}

// GET /rooms/:roomId/messages
router.get("/rooms/:roomId/messages", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const roomId = parseInt(req.params.roomId, 10);
  if (isNaN(roomId)) { res.status(400).json({ error: "Invalid room ID" }); return; }

  const messages = await db
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.roomId, roomId))
    .orderBy(asc(chatMessagesTable.createdAt));

  if (messages.length === 0) { res.json([]); return; }

  const userIds = [...new Set(messages.map((m) => m.userId))];
  const users = await db.select().from(usersTable).where(inArray(usersTable.id, userIds));

  res.json(
    messages.map((msg) => ({
      id: msg.id,
      roomId: msg.roomId,
      userId: msg.userId,
      userProfile: formatUser(users.find((u) => u.id === msg.userId)!),
      message: msg.message,
      createdAt: msg.createdAt.toISOString(),
    })),
  );
});

// POST /rooms/:roomId/messages
router.post("/rooms/:roomId/messages", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const roomId = parseInt(req.params.roomId, 10);
  if (isNaN(roomId)) { res.status(400).json({ error: "Invalid room ID" }); return; }

  const { message } = req.body;
  if (!message || typeof message !== "string" || message.trim().length === 0) {
    res.status(400).json({ error: "Message is required" }); return;
  }

  const [msg] = await db
    .insert(chatMessagesTable)
    .values({ roomId, userId, message: message.trim().slice(0, 1000) })
    .returning();

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);

  res.status(201).json({
    id: msg.id,
    roomId: msg.roomId,
    userId: msg.userId,
    userProfile: formatUser(user),
    message: msg.message,
    createdAt: msg.createdAt.toISOString(),
  });
});

export default router;
