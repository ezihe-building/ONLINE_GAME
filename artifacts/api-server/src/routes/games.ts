import { Router } from "express";
import { db, usersTable, roomMembersTable, gameSessionsTable, flirtMessagesTable } from "@workspace/db";
import { eq, desc, inArray } from "drizzle-orm";
import { StartGameBody, StartGameParams, MakeMoveBody, MakeMoveParams, GetGameParams, GetRoomHistoryParams, RequestRematchParams } from "@workspace/api-zod";
import { formatUser } from "./rooms";

const router = Router();

function requireAuth(req: any, res: any): number | null {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return null;
  }
  return req.session.userId;
}

async function getGameWithProfiles(gameId: number) {
  const [game] = await db
    .select()
    .from(gameSessionsTable)
    .where(eq(gameSessionsTable.id, gameId))
    .limit(1);

  if (!game) return null;

  const userIds = [game.playerXUserId, game.playerOUserId];
  if (game.winnerUserId && !userIds.includes(game.winnerUserId)) {
    userIds.push(game.winnerUserId);
  }

  const users = await db.select().from(usersTable).where(inArray(usersTable.id, userIds));
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
    boardState: game.boardState as Record<string, unknown>,
    flirtSent: game.flirtSent,
    createdAt: game.createdAt.toISOString(),
    finishedAt: game.finishedAt?.toISOString() ?? null,
  };
}

function initBoardState(gameType: string, playerXId: number): Record<string, unknown> {
  switch (gameType) {
    case "tic-tac-toe":
      return { board: Array(9).fill(null), moveHistory: [] };
    case "connect-four":
      return {
        board: Array(6).fill(null).map(() => Array(7).fill(null)),
        moveHistory: [],
      };
    case "rock-paper-scissors":
      return { rounds: [], currentRound: 1, moveHistory: [] };
    case "word-duel":
      return {
        phase: "setting",
        secretWord: null,
        guesses: [],
        currentGuesserUserId: null,
        moveHistory: [],
      };
    case "truth-spinner":
      return {
        questions: [
          "What's the most embarrassing thing you've done for someone you liked?",
          "What's your biggest romantic red flag?",
          "What's the cheesiest pick-up line you've ever used or received?",
          "What's something you've never told anyone you find attractive?",
          "What would your ideal first date look like?",
        ],
        currentQuestionIndex: 0,
        scores: { X: 0, O: 0 },
        answers: [],
        phase: "spinning",
        moveHistory: [],
      };
    default:
      return {};
  }
}

function applyMove(
  gameType: string,
  boardState: Record<string, unknown>,
  moveData: Record<string, unknown>,
  playerRole: "X" | "O",
  playerId: number,
  playerXId: number,
  playerOId: number,
): { newState: Record<string, unknown>; winner: "X" | "O" | "draw" | null } {
  const state = { ...boardState };
  const history: unknown[] = (state.moveHistory as unknown[]) ?? [];

  switch (gameType) {
    case "tic-tac-toe": {
      const board = [...(state.board as (string | null)[])];
      const cell = moveData.cell as number;
      if (board[cell] !== null) return { newState: state, winner: null };
      board[cell] = playerRole;
      history.push({ cell, player: playerRole });
      state.board = board;
      state.moveHistory = history;

      const wins = [
        [0,1,2],[3,4,5],[6,7,8],
        [0,3,6],[1,4,7],[2,5,8],
        [0,4,8],[2,4,6],
      ];
      for (const [a,b,c] of wins) {
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
          return { newState: state, winner: board[a] as "X"|"O" };
        }
      }
      if (board.every((c) => c !== null)) return { newState: state, winner: "draw" };
      return { newState: state, winner: null };
    }

    case "connect-four": {
      const board = (state.board as (string | null)[][]).map((r) => [...r]);
      const col = moveData.col as number;
      let row = -1;
      for (let r = 5; r >= 0; r--) {
        if (board[r][col] === null) { row = r; break; }
      }
      if (row === -1) return { newState: state, winner: null };
      board[row][col] = playerRole;
      history.push({ col, row, player: playerRole });
      state.board = board;
      state.moveHistory = history;

      // Check win
      const check = (r: number, c: number, dr: number, dc: number): boolean => {
        const p = board[r][c];
        if (!p) return false;
        for (let i = 1; i < 4; i++) {
          const nr = r + dr * i, nc = c + dc * i;
          if (nr < 0 || nr > 5 || nc < 0 || nc > 6 || board[nr][nc] !== p) return false;
        }
        return true;
      };
      for (let r = 0; r < 6; r++) {
        for (let c = 0; c < 7; c++) {
          if (check(r,c,0,1) || check(r,c,1,0) || check(r,c,1,1) || check(r,c,1,-1)) {
            return { newState: state, winner: board[r][c] as "X"|"O" };
          }
        }
      }
      if (board[0].every((c) => c !== null)) return { newState: state, winner: "draw" };
      return { newState: state, winner: null };
    }

    case "rock-paper-scissors": {
      const rounds = [...((state.rounds as object[]) ?? [])];
      const currentRound = state.currentRound as number;
      let round: Record<string, unknown> = rounds[currentRound - 1] ? { ...(rounds[currentRound - 1] as Record<string, unknown>) } : {};
      round[playerRole] = moveData.choice;
      rounds[currentRound - 1] = round;
      history.push({ round: currentRound, player: playerRole, choice: moveData.choice });

      // If both players have chosen
      if (round.X && round.O) {
        const rpsWinner = (a: string, b: string): "X" | "O" | "draw" => {
          if (a === b) return "draw";
          if ((a === "rock" && b === "scissors") || (a === "paper" && b === "rock") || (a === "scissors" && b === "paper")) return "X";
          return "O";
        };
        round.winner = rpsWinner(round.X as string, round.O as string);
        rounds[currentRound - 1] = round;

        // Count wins
        const xWins = rounds.filter((r: any) => r.winner === "X").length;
        const oWins = rounds.filter((r: any) => r.winner === "O").length;

        if (xWins >= 2) { state.rounds = rounds; state.moveHistory = history; return { newState: state, winner: "X" }; }
        if (oWins >= 2) { state.rounds = rounds; state.moveHistory = history; return { newState: state, winner: "O" }; }
        if (currentRound >= 3) { state.rounds = rounds; state.moveHistory = history; return { newState: state, winner: "draw" }; }

        state.currentRound = currentRound + 1;
        rounds.push({});
      }

      state.rounds = rounds;
      state.moveHistory = history;
      return { newState: state, winner: null };
    }

    case "word-duel": {
      const phase = state.phase as string;

      if (phase === "setting" && moveData.secretWord) {
        const word = (moveData.secretWord as string).toUpperCase();
        state.secretWord = word;
        state.phase = "guessing";
        // The guesser is the opponent
        state.currentGuesserUserId = playerId === playerXId ? playerOId : playerXId;
        history.push({ phase: "set", player: playerRole });
        state.moveHistory = history;
        return { newState: state, winner: null };
      }

      if (phase === "guessing" && moveData.guess) {
        const guess = (moveData.guess as string).toUpperCase();
        const secret = state.secretWord as string;
        const guesses = [...((state.guesses as object[]) ?? [])];

        const result = guess.split("").map((letter, i) => {
          if (secret[i] === letter) return "correct";
          if (secret.includes(letter)) return "present";
          return "absent";
        });

        guesses.push({ word: guess, result });
        state.guesses = guesses;
        history.push({ phase: "guess", word: guess, result, player: playerRole });
        state.moveHistory = history;

        if (guess === secret) {
          // Guesser wins
          return { newState: state, winner: playerRole };
        }
        if (guesses.length >= 6) {
          // Setter wins — guesser couldn't guess in 6
          const setterRole: "X" | "O" = playerRole === "X" ? "O" : "X";
          return { newState: state, winner: setterRole };
        }
        return { newState: state, winner: null };
      }

      return { newState: state, winner: null };
    }

    case "truth-spinner": {
      const answers = [...((state.answers as object[]) ?? [])];
      const scores = { ...(state.scores as Record<string, number>) };
      const currentQuestionIndex = state.currentQuestionIndex as number;
      const questions = state.questions as string[];

      if (moveData.action === "answer" && moveData.answer) {
        answers.push({
          userId: playerId,
          question: questions[currentQuestionIndex],
          answer: moveData.answer,
          points: 1,
        });
        scores[playerRole] = (scores[playerRole] ?? 0) + 1;
        history.push({ player: playerRole, question: questions[currentQuestionIndex], answered: true });

        const nextIndex = currentQuestionIndex + 1;
        state.answers = answers;
        state.scores = scores;
        state.moveHistory = history;

        if (nextIndex >= questions.length) {
          state.phase = "finished";
          if (scores.X > scores.O) return { newState: state, winner: "X" };
          if (scores.O > scores.X) return { newState: state, winner: "O" };
          return { newState: state, winner: "draw" };
        }

        state.currentQuestionIndex = nextIndex;
        state.phase = "spinning";
      } else if (moveData.action === "spin") {
        state.phase = "answering";
        history.push({ player: playerRole, action: "spin" });
        state.moveHistory = history;
      }

      return { newState: state, winner: null };
    }

    default:
      return { newState: state, winner: null };
  }
}

// POST /rooms/:roomId/games
router.post("/rooms/:roomId/games", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const params = StartGameParams.safeParse({ roomId: parseInt(req.params.roomId, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid room ID" }); return; }

  const body = StartGameBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: "Invalid request body" }); return; }

  const { gameType, opponentId } = body.data;
  const roomId = params.data.roomId;

  // Randomize who is X and O
  const [playerXUserId, playerOUserId] = Math.random() > 0.5
    ? [userId, opponentId]
    : [opponentId, userId];

  const initialState = initBoardState(gameType, playerXUserId);

  // For word-duel, setter goes first (playerX sets the word)
  const currentTurnUserId = gameType === "truth-spinner"
    ? playerXUserId
    : playerXUserId;

  const [game] = await db
    .insert(gameSessionsTable)
    .values({
      roomId,
      gameType,
      playerXUserId,
      playerOUserId,
      currentTurnUserId,
      boardState: initialState,
    })
    .returning();

  const result = await getGameWithProfiles(game.id);
  res.status(201).json(result);
});

// GET /rooms/:roomId/history
router.get("/rooms/:roomId/history", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const params = GetRoomHistoryParams.safeParse({ roomId: parseInt(req.params.roomId, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid room ID" }); return; }

  const games = await db
    .select()
    .from(gameSessionsTable)
    .where(eq(gameSessionsTable.roomId, params.data.roomId))
    .orderBy(desc(gameSessionsTable.createdAt));

  if (games.length === 0) { res.json([]); return; }

  const allUserIds = [...new Set(games.flatMap((g) => [g.playerXUserId, g.playerOUserId]))];
  const users = await db.select().from(usersTable).where(inArray(usersTable.id, allUserIds));

  const result = games.map((game) => {
    const px = users.find((u) => u.id === game.playerXUserId);
    const po = users.find((u) => u.id === game.playerOUserId);
    const winner = game.winnerUserId ? users.find((u) => u.id === game.winnerUserId) : undefined;
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
  });

  res.json(result);
});

// GET /games/:gameId
router.get("/games/:gameId", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const params = GetGameParams.safeParse({ gameId: parseInt(req.params.gameId, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid game ID" }); return; }

  const result = await getGameWithProfiles(params.data.gameId);
  if (!result) { res.status(404).json({ error: "Game not found" }); return; }

  res.json(result);
});

// POST /games/:gameId/moves
router.post("/games/:gameId/moves", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const params = MakeMoveParams.safeParse({ gameId: parseInt(req.params.gameId, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid game ID" }); return; }

  const body = MakeMoveBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: "Invalid move data" }); return; }

  const [game] = await db
    .select()
    .from(gameSessionsTable)
    .where(eq(gameSessionsTable.id, params.data.gameId))
    .limit(1);

  if (!game) { res.status(404).json({ error: "Game not found" }); return; }
  if (game.status === "finished") { res.status(400).json({ error: "Game is already finished" }); return; }

  // For rock-paper-scissors, both players can move in the same round (simultaneous)
  const isRPS = game.gameType === "rock-paper-scissors";
  if (!isRPS && game.currentTurnUserId !== userId) {
    res.status(400).json({ error: "Not your turn" }); return;
  }

  const playerRole: "X" | "O" = game.playerXUserId === userId ? "X" : "O";
  const boardState = game.boardState as Record<string, unknown>;
  const moveData = body.data.moveData as Record<string, unknown>;

  const { newState, winner } = applyMove(
    game.gameType,
    boardState,
    moveData,
    playerRole,
    userId,
    game.playerXUserId,
    game.playerOUserId,
  );

  const nextTurnUserId = game.currentTurnUserId === game.playerXUserId
    ? game.playerOUserId
    : game.playerXUserId;

  let updateData: Partial<typeof gameSessionsTable.$inferInsert> & {
    boardState?: Record<string, unknown>;
    status?: string;
    currentTurnUserId?: number | null;
    winnerUserId?: number | null;
    isDraw?: boolean;
    finishedAt?: Date | null;
  } = {
    boardState: newState,
    currentTurnUserId: nextTurnUserId,
  };

  if (winner) {
    updateData.status = "finished";
    updateData.finishedAt = new Date();
    if (winner === "draw") {
      updateData.isDraw = true;
      updateData.currentTurnUserId = null;
    } else {
      updateData.winnerUserId = winner === "X" ? game.playerXUserId : game.playerOUserId;
      updateData.currentTurnUserId = null;
    }
  }

  await db
    .update(gameSessionsTable)
    .set(updateData as any)
    .where(eq(gameSessionsTable.id, game.id));

  const result = await getGameWithProfiles(game.id);
  res.json(result);
});

// POST /games/:gameId/rematch
router.post("/games/:gameId/rematch", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const params = RequestRematchParams.safeParse({ gameId: parseInt(req.params.gameId, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid game ID" }); return; }

  const [game] = await db
    .select()
    .from(gameSessionsTable)
    .where(eq(gameSessionsTable.id, params.data.gameId))
    .limit(1);

  if (!game) { res.status(404).json({ error: "Game not found" }); return; }

  // Swap X and O for rematch
  const [playerXUserId, playerOUserId] = [game.playerOUserId, game.playerXUserId];
  const initialState = initBoardState(game.gameType, playerXUserId);

  const [newGame] = await db
    .insert(gameSessionsTable)
    .values({
      roomId: game.roomId,
      gameType: game.gameType,
      playerXUserId,
      playerOUserId,
      currentTurnUserId: playerXUserId,
      boardState: initialState,
    })
    .returning();

  const result = await getGameWithProfiles(newGame.id);
  res.status(201).json(result);
});

export default router;
