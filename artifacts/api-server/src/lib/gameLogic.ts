type GameState = Record<string, unknown>;

export function initGameState(gameType: string): GameState {
  switch (gameType) {
    case "tic-tac-toe":
      return { board: Array(9).fill(null) };
    case "connect-four":
      return {
        board: Array.from({ length: 6 }, () => Array(7).fill(null)),
      };
    case "rock-paper-scissors":
      return { round: 1, maxRounds: 3, scores: { x: 0, o: 0 }, picks: {} };
    case "word-duel":
      return {
        xWord: null,
        oWord: null,
        xGuesses: [],
        oGuesses: [],
        xSolved: false,
        oSolved: false,
      };
    case "truth-spinner":
      return {
        round: 1,
        maxRounds: 5,
        scores: { x: 0, o: 0 },
        prompts: [],
        currentPrompt: null,
        phase: "spin",
      };
    default:
      return {};
  }
}

export function applyMove(
  gameType: string,
  state: GameState,
  moveData: Record<string, unknown>,
  playerRole: "x" | "o",
): { newState: GameState; winner: "x" | "o" | null; isDraw: boolean } {
  switch (gameType) {
    case "tic-tac-toe":
      return applyTicTacToe(state, moveData, playerRole);
    case "connect-four":
      return applyConnectFour(state, moveData, playerRole);
    case "rock-paper-scissors":
      return applyRPS(state, moveData, playerRole);
    case "word-duel":
      return applyWordDuel(state, moveData, playerRole);
    case "truth-spinner":
      return applyTruthSpinner(state, moveData, playerRole);
    default:
      return { newState: state, winner: null, isDraw: false };
  }
}

// ── Tic Tac Toe ─────────────────────────────────────────────────────────────

function applyTicTacToe(
  state: GameState,
  moveData: Record<string, unknown>,
  playerRole: "x" | "o",
): { newState: GameState; winner: "x" | "o" | null; isDraw: boolean } {
  const board = [...(state.board as (string | null)[])];
  const cell = moveData.cell as number;
  if (board[cell] !== null) {
    return { newState: state, winner: null, isDraw: false };
  }
  board[cell] = playerRole;
  const newState = { ...state, board };
  const winner = checkTicTacToeWinner(board);
  const isDraw = !winner && board.every((c) => c !== null);
  return { newState, winner, isDraw };
}

function checkTicTacToeWinner(board: (string | null)[]): "x" | "o" | null {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];
  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a] as "x" | "o";
    }
  }
  return null;
}

// ── Connect Four ─────────────────────────────────────────────────────────────

function applyConnectFour(
  state: GameState,
  moveData: Record<string, unknown>,
  playerRole: "x" | "o",
): { newState: GameState; winner: "x" | "o" | null; isDraw: boolean } {
  const board = (state.board as (string | null)[][]).map((row) => [...row]);
  const col = moveData.column as number;
  let placed = false;
  for (let row = 5; row >= 0; row--) {
    if (board[row][col] === null) {
      board[row][col] = playerRole;
      placed = true;
      break;
    }
  }
  if (!placed) return { newState: state, winner: null, isDraw: false };
  const newState = { ...state, board };
  const winner = checkConnectFourWinner(board);
  const isDraw = !winner && board.every((row) => row.every((c) => c !== null));
  return { newState, winner, isDraw };
}

function checkConnectFourWinner(board: (string | null)[][]): "x" | "o" | null {
  const rows = board.length;
  const cols = board[0].length;
  const check = (r: number, c: number, dr: number, dc: number): string | null => {
    const val = board[r][c];
    if (!val) return null;
    for (let i = 1; i < 4; i++) {
      const nr = r + dr * i;
      const nc = c + dc * i;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || board[nr][nc] !== val) return null;
    }
    return val;
  };
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const w =
        check(r, c, 0, 1) ||
        check(r, c, 1, 0) ||
        check(r, c, 1, 1) ||
        check(r, c, 1, -1);
      if (w) return w as "x" | "o";
    }
  }
  return null;
}

// ── Rock Paper Scissors ───────────────────────────────────────────────────────

function applyRPS(
  state: GameState,
  moveData: Record<string, unknown>,
  playerRole: "x" | "o",
): { newState: GameState; winner: "x" | "o" | null; isDraw: boolean } {
  const picks = { ...(state.picks as Record<string, string>) };
  picks[playerRole] = moveData.choice as string;
  let scores = { ...(state.scores as { x: number; o: number }) };
  let round = state.round as number;
  const maxRounds = state.maxRounds as number;
  let roundWinner: string | null = null;

  if (picks.x && picks.o) {
    roundWinner = getRPSRoundWinner(picks.x, picks.o);
    if (roundWinner === "x") scores.x++;
    else if (roundWinner === "o") scores.o++;
    round++;
  }

  const newState = { ...state, picks: picks.x && picks.o ? {} : picks, scores, round };

  if (round > maxRounds || scores.x > maxRounds / 2 || scores.o > maxRounds / 2) {
    if (scores.x > scores.o) return { newState, winner: "x", isDraw: false };
    if (scores.o > scores.x) return { newState, winner: "o", isDraw: false };
    return { newState, winner: null, isDraw: true };
  }
  return { newState, winner: null, isDraw: false };
}

function getRPSRoundWinner(x: string, o: string): "x" | "o" | null {
  if (x === o) return null;
  if (
    (x === "rock" && o === "scissors") ||
    (x === "scissors" && o === "paper") ||
    (x === "paper" && o === "rock")
  ) return "x";
  return "o";
}

// ── Word Duel ─────────────────────────────────────────────────────────────────

function applyWordDuel(
  state: GameState,
  moveData: Record<string, unknown>,
  playerRole: "x" | "o",
): { newState: GameState; winner: "x" | "o" | null; isDraw: boolean } {
  const newState = { ...state } as Record<string, unknown>;

  if (moveData.type === "set-word") {
    newState[`${playerRole}Word`] = (moveData.word as string).toLowerCase();
  } else if (moveData.type === "guess") {
    const guess = (moveData.word as string).toLowerCase();
    const guesses = [...(newState[`${playerRole}Guesses`] as string[])];
    guesses.push(guess);
    newState[`${playerRole}Guesses`] = guesses;
    const targetWord = newState[playerRole === "x" ? "oWord" : "xWord"] as string | null;
    if (targetWord && guess === targetWord) {
      newState[`${playerRole}Solved`] = true;
    }
  }

  const xSolved = newState.xSolved as boolean;
  const oSolved = newState.oSolved as boolean;
  const xGuesses = newState.xGuesses as string[];
  const oGuesses = newState.oGuesses as string[];

  if (xSolved || oSolved || xGuesses.length >= 6 || oGuesses.length >= 6) {
    if (xSolved && !oSolved) return { newState: newState as GameState, winner: "x", isDraw: false };
    if (oSolved && !xSolved) return { newState: newState as GameState, winner: "o", isDraw: false };
    if (xSolved && oSolved) return { newState: newState as GameState, winner: null, isDraw: true };
    if (xGuesses.length >= 6 && oGuesses.length >= 6) {
      return { newState: newState as GameState, winner: null, isDraw: true };
    }
  }

  return { newState: newState as GameState, winner: null, isDraw: false };
}

// ── Truth Spinner ─────────────────────────────────────────────────────────────

const TRUTH_PROMPTS = [
  "What's your most embarrassing moment?",
  "What's something you've never told anyone?",
  "What's your biggest fear?",
  "When did you last lie to someone you care about?",
  "What's a secret talent you have?",
  "What's the most adventurous thing you've done?",
  "What's a bad habit you secretly enjoy?",
  "What's your most irrational fear?",
  "Who was your first crush?",
  "What's the weirdest thing you've ever done?",
];

function applyTruthSpinner(
  state: GameState,
  moveData: Record<string, unknown>,
  _playerRole: "x" | "o",
): { newState: GameState; winner: "x" | "o" | null; isDraw: boolean } {
  const newState = { ...state } as Record<string, unknown>;
  const scores = { ...(state.scores as { x: number; o: number }) };
  let round = state.round as number;
  const maxRounds = state.maxRounds as number;

  if (moveData.type === "spin") {
    const idx = Math.floor(Math.random() * TRUTH_PROMPTS.length);
    newState.currentPrompt = TRUTH_PROMPTS[idx];
    newState.phase = "answer";
  } else if (moveData.type === "answer") {
    newState.phase = "spin";
    newState.currentPrompt = null;
    const currentTurnRole = _playerRole;
    scores[currentTurnRole]++;
    round++;
    newState.round = round;
  }

  newState.scores = scores;

  if (round > maxRounds) {
    if (scores.x > scores.o) return { newState: newState as GameState, winner: "x", isDraw: false };
    if (scores.o > scores.x) return { newState: newState as GameState, winner: "o", isDraw: false };
    return { newState: newState as GameState, winner: null, isDraw: true };
  }
  return { newState: newState as GameState, winner: null, isDraw: false };
}
