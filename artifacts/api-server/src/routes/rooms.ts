import { Router, type IRouter } from "express";
import { eq, or } from "drizzle-orm";
import { db, roomsTable, usersTable } from "@workspace/db";
import { requireAuth, getUserId } from "../lib/auth";
import { GetRoomByCodeParams, GetRoomParams, JoinRoomParams } from "@workspace/api-zod";

const router: IRouter = Router();

function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

async function getProfile(userId: number | null | undefined) {
  if (!userId) return undefined;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) return undefined;
  const { passwordHash: _ph, ...safe } = user;
  return safe ?? undefined;
}

async function enrichRoom(room: typeof roomsTable.$inferSelect) {
  const [creatorProfile, guestProfile] = await Promise.all([
    getProfile(room.creatorUserId),
    getProfile(room.guestUserId ?? undefined),
  ]);
  return { ...room, creatorProfile, guestProfile };
}

router.post("/rooms", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  let code = generateCode();
  let attempts = 0;
  while (attempts < 5) {
    const [existing] = await db.select().from(roomsTable).where(eq(roomsTable.code, code));
    if (!existing) break;
    code = generateCode();
    attempts++;
  }
  const [room] = await db
    .insert(roomsTable)
    .values({ code, creatorUserId: userId, status: "waiting" })
    .returning();
  res.status(201).json(await enrichRoom(room));
});

router.get("/rooms/my", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const rooms = await db
    .select()
    .from(roomsTable)
    .where(or(eq(roomsTable.creatorUserId, userId), eq(roomsTable.guestUserId, userId)));
  const enriched = await Promise.all(rooms.map(enrichRoom));
  res.json(enriched);
});

router.get("/rooms/join/:code", requireAuth, async (req, res): Promise<void> => {
  const params = GetRoomByCodeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [room] = await db.select().from(roomsTable).where(eq(roomsTable.code, params.data.code));
  if (!room) {
    res.status(404).json({ error: "Room not found" });
    return;
  }
  res.json(await enrichRoom(room));
});

router.get("/rooms/:roomId", requireAuth, async (req, res): Promise<void> => {
  const params = GetRoomParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [room] = await db.select().from(roomsTable).where(eq(roomsTable.id, params.data.roomId));
  if (!room) {
    res.status(404).json({ error: "Room not found" });
    return;
  }
  res.json(await enrichRoom(room));
});

router.post("/rooms/:roomId/join", requireAuth, async (req, res): Promise<void> => {
  const params = JoinRoomParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const userId = getUserId(req);
  const [room] = await db.select().from(roomsTable).where(eq(roomsTable.id, params.data.roomId));
  if (!room) {
    res.status(404).json({ error: "Room not found" });
    return;
  }
  if (room.guestUserId && room.guestUserId !== userId) {
    res.status(400).json({ error: "Room is full" });
    return;
  }
  if (room.creatorUserId === userId) {
    res.json(await enrichRoom(room));
    return;
  }
  const [updated] = await db
    .update(roomsTable)
    .set({ guestUserId: userId, status: "active" })
    .where(eq(roomsTable.id, params.data.roomId))
    .returning();
  res.json(await enrichRoom(updated));
});

export default router;
