import { Router } from "express";
import { db, usersTable, roomsTable, roomMembersTable, gameSessionsTable } from "@workspace/db";
import { eq, inArray, desc } from "drizzle-orm";
import { CreateRoomBody, JoinRoomBody } from "@workspace/api-zod";
import { nanoid } from "nanoid";

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

async function formatRoom(roomId: number, currentUserId: number) {
  const [room] = await db
    .select()
    .from(roomsTable)
    .where(eq(roomsTable.id, roomId))
    .limit(1);

  if (!room) return null;

  const memberships = await db
    .select()
    .from(roomMembersTable)
    .where(eq(roomMembersTable.roomId, roomId));

  const memberIds = memberships.map((m) => m.userId);
  const members = memberIds.length > 0
    ? await db.select().from(usersTable).where(inArray(usersTable.id, memberIds))
    : [];

  const [recentGame] = await db
    .select()
    .from(gameSessionsTable)
    .where(eq(gameSessionsTable.roomId, roomId))
    .orderBy(desc(gameSessionsTable.createdAt))
    .limit(1);

  return {
    id: room.id,
    name: room.name,
    inviteCode: room.inviteCode,
    createdBy: room.createdBy,
    members: members.map(formatUser),
    recentGame: recentGame ? formatGameSession(recentGame, members) : undefined,
    createdAt: room.createdAt.toISOString(),
  };
}

function formatGameSession(game: typeof gameSessionsTable.$inferSelect, users: (typeof usersTable.$inferSelect)[]) {
  const findUser = (id: number | null) => id ? users.find((u) => u.id === id) : undefined;
  const px = findUser(game.playerXUserId);
  const po = findUser(game.playerOUserId);
  const winner = game.winnerUserId ? findUser(game.winnerUserId) : undefined;

  return {
    id: game.id,
    roomId: game.roomId,
    gameType: game.gameType,
    status: game.status,
    playerXUserId: game.playerXUserId,
    playerOUserId: game.playerOUserId,
    playerXProfile: px ? formatUser(px) : undefined,
    playerOProfile: po ? formatUser(po) : undefined,
    currentTurnUserId: game.currentTurnUserId ?? null,
    winnerUserId: game.winnerUserId ?? null,
    winnerProfile: winner ? formatUser(winner) : undefined,
    isDraw: game.isDraw,
    boardState: game.boardState,
    flirtSent: game.flirtSent,
    createdAt: game.createdAt.toISOString(),
    finishedAt: game.finishedAt?.toISOString() ?? null,
  };
}

router.get("/rooms", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const memberships = await db
    .select()
    .from(roomMembersTable)
    .where(eq(roomMembersTable.userId, userId));

  const roomIds = memberships.map((m) => m.roomId);
  if (roomIds.length === 0) {
    res.json([]);
    return;
  }

  const rooms = await Promise.all(roomIds.map((id) => formatRoom(id, userId)));
  res.json(rooms.filter(Boolean));
});

router.post("/rooms", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const parsed = CreateRoomBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const inviteCode = nanoid(8).toUpperCase();
  const [room] = await db
    .insert(roomsTable)
    .values({ name: parsed.data.name, inviteCode, createdBy: userId })
    .returning();

  await db.insert(roomMembersTable).values({ roomId: room.id, userId });

  const formatted = await formatRoom(room.id, userId);
  res.status(201).json(formatted);
});

router.post("/rooms/join", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const parsed = JoinRoomBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid invite code" });
    return;
  }

  const [room] = await db
    .select()
    .from(roomsTable)
    .where(eq(roomsTable.inviteCode, parsed.data.inviteCode.toUpperCase()))
    .limit(1);

  if (!room) {
    res.status(404).json({ error: "Room not found" });
    return;
  }

  const existing = await db
    .select()
    .from(roomMembersTable)
    .where(eq(roomMembersTable.roomId, room.id))
    .then((members) => members.find((m) => m.userId === userId));

  if (!existing) {
    await db.insert(roomMembersTable).values({ roomId: room.id, userId });
  }

  const formatted = await formatRoom(room.id, userId);
  res.json(formatted);
});

router.get("/rooms/:roomId", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const roomId = parseInt(req.params.roomId, 10);
  if (isNaN(roomId)) {
    res.status(400).json({ error: "Invalid room ID" });
    return;
  }

  const formatted = await formatRoom(roomId, userId);
  if (!formatted) {
    res.status(404).json({ error: "Room not found" });
    return;
  }

  res.json(formatted);
});

export { formatUser, formatGameSession };
export default router;
