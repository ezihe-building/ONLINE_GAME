import { Router, type IRouter } from "express";
import { eq, desc, and } from "drizzle-orm";
import {
  db,
  gameSessionsTable,
  gameMovesTable,
  roomsTable,
  usersTable,
} from "@workspace/db";
import { requireAuth, getUserId } from "../lib/auth";
import {
  CreateGameParams,
  CreateGameBody,
  GetCurrentGameParams,
  GetGameParams,
  ListMovesParams,
  MakeMoveParams,
  MakeMoveBody,
  RequestRematchParams,
  ListRoomGamesParams,
} from "@workspace/api-zod";
import { initGameState, applyMove } from "../lib/gameLogic";

const router: IRouter = Router();

const GAME_TYPES = [
  {
    key: "tic-tac-toe",
    name: "Tic Tac Toe",
    description: "Classic 3×3 grid — get three in a row to win",
    minPlayers: 2,
    maxPlayers: 2,
  },
  {
    key: "connect-four",
    name: "Connect Four",
    description: "Drop discs — connect 4 in a row horizontally, vertically, or diagonally",
    minPlayers: 2,
    maxPlayers: 2,
  },
  {
    key: "rock-paper-scissors",
    name: "Rock Paper Scissors",
    description: "Best of 3 rounds — pick your weapon",
    minPlayers: 2,
    maxPlayers: 2,
  },
  {
    key: "word-duel",
    name: "Word Duel",
    description: "Set a secret 5-letter word for your opponent to guess (Wordle-style)",
    minPlayers: 2,
    maxPlayers: 2,
  },
  {
    key: "truth-spinner",
    name: "Truth Spinner",
    description: "Spin the wheel, answer truth questions — rack up points",
    minPlayers: 2,
    maxPlayers: 2,
  },
];

async function getProfile(clerkId: string | null | undefined) {
  if (!clerkId) return undefined;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId));
  return user ?? undefined;
}

async function enrichSession(session: typeof gameSessionsTable.$inferSelect) {
  const [xProfile, oProfile] = await Promise.all([
    getProfile(session.playerXClerkId),
    getProfile(session.playerOClerkId),
  ]);
  return { ...session, playerXProfile: xProfile, playerOProfile: oProfile };
}

router.get("/game-types", async (_req, res): Promise<void> => {
  res.json(GAME_TYPES);
});

router.get("/rooms/:roomId/games", requireAuth, async (req, res): Promise<void> => {
  const params = ListRoomGamesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const sessions = await db
    .select()
    .from(gameSessionsTable)
    .where(eq(gameSessionsTable.roomId, params.data.roomId))
    .orderBy(desc(gameSessionsTable.createdAt));
  const enriched = await Promise.all(sessions.map(enrichSession));
  res.json(enriched);
});

router.post("/rooms/:roomId/games", requireAuth, async (req, res): Promise<void> => {
  const params = CreateGameParams.safeParse(req.params);
  const body = CreateGameBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const clerkId = getUserId(req);
  const [room] = await db.select().from(roomsTable).where(eq(roomsTable.id, params.data.roomId));
  if (!room || !room.guestClerkId) {
    res.status(400).json({ error: "Room needs two players to start a game" });
    return;
  }
  if (room.creatorClerkId !== clerkId && room.guestClerkId !== clerkId) {
    res.status(403).json({ error: "Not a member of this room" });
    return;
  }

  const gameType = body.data.gameType;
  const validTypes = GAME_TYPES.map((g) => g.key);
  if (!validTypes.includes(gameType)) {
    res.status(400).json({ error: "Invalid game type" });
    return;
  }

  const initialState = initGameState(gameType);
  const playerXClerkId = room.creatorClerkId;
  const playerOClerkId = room.guestClerkId;

  const [session] = await db
    .insert(gameSessionsTable)
    .values({
      roomId: params.data.roomId,
      gameType,
      playerXClerkId,
      playerOClerkId,
      currentTurnClerkId: playerXClerkId,
      status: "active",
      state: initialState,
    })
    .returning();

  res.status(201).json(await enrichSession(session));
});

router.get("/rooms/:roomId/games/current", requireAuth, async (req, res): Promise<void> => {
  const params = GetCurrentGameParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [session] = await db
    .select()
    .from(gameSessionsTable)
    .where(
      and(
        eq(gameSessionsTable.roomId, params.data.roomId),
        eq(gameSessionsTable.status, "active"),
      ),
    )
    .orderBy(desc(gameSessionsTable.createdAt))
    .limit(1);

  if (!session) {
    res.status(404).json({ error: "No active game in this room" });
    return;
  }
  res.json(await enrichSession(session));
});

router.get("/games/:gameId", requireAuth, async (req, res): Promise<void> => {
  const params = GetGameParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [session] = await db
    .select()
    .from(gameSessionsTable)
    .where(eq(gameSessionsTable.id, params.data.gameId));
  if (!session) {
    res.status(404).json({ error: "Game not found" });
    return;
  }
  res.json(await enrichSession(session));
});

router.get("/games/:gameId/moves", requireAuth, async (req, res): Promise<void> => {
  const params = ListMovesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const moves = await db
    .select()
    .from(gameMovesTable)
    .where(eq(gameMovesTable.gameId, params.data.gameId));
  res.json(moves);
});

router.post("/games/:gameId/moves", requireAuth, async (req, res): Promise<void> => {
  const params = MakeMoveParams.safeParse(req.params);
  const body = MakeMoveBody.safeParse(req.body);
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
  if (session.playerXClerkId !== clerkId && session.playerOClerkId !== clerkId) {
    res.status(403).json({ error: "Not a player in this game" });
    return;
  }
  if (session.status === "finished") {
    res.status(400).json({ error: "Game is already finished" });
    return;
  }
  if (session.currentTurnClerkId !== clerkId) {
    res.status(400).json({ error: "Not your turn" });
    return;
  }

  const playerRole: "x" | "o" = session.playerXClerkId === clerkId ? "x" : "o";
  const moveData = body.data.moveData as Record<string, unknown>;

  const { newState, winner, isDraw } = applyMove(
    session.gameType,
    session.state as Record<string, unknown>,
    moveData,
    playerRole,
  );

  await db.insert(gameMovesTable).values({
    gameId: session.id,
    playerClerkId: clerkId,
    moveData,
  });

  const nextTurn =
    session.playerXClerkId === clerkId ? session.playerOClerkId : session.playerXClerkId;

  const updates: Partial<typeof gameSessionsTable.$inferInsert> = {
    state: newState,
    currentTurnClerkId: nextTurn,
  };

  if (winner || isDraw) {
    updates.status = "finished";
    updates.finishedAt = new Date();
    updates.isDraw = isDraw;
    if (winner) {
      updates.winnerClerkId =
        winner === "x" ? session.playerXClerkId : session.playerOClerkId;
    }
  }

  const [updated] = await db
    .update(gameSessionsTable)
    .set(updates)
    .where(eq(gameSessionsTable.id, session.id))
    .returning();

  res.json(await enrichSession(updated));
});

router.post("/games/:gameId/rematch", requireAuth, async (req, res): Promise<void> => {
  const params = RequestRematchParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
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

  const initialState = initGameState(session.gameType);
  const [newSession] = await db
    .insert(gameSessionsTable)
    .values({
      roomId: session.roomId,
      gameType: session.gameType,
      playerXClerkId: session.playerOClerkId,
      playerOClerkId: session.playerXClerkId,
      currentTurnClerkId: session.playerOClerkId,
      status: "active",
      state: initialState,
    })
    .returning();

  res.status(201).json(await enrichSession(newSession));
});

export default router;
