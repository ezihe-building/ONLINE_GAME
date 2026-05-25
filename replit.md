# Flirt & Play

A sexy multiplayer game platform where two players battle across 5 games — and the loser owes the winner a flirt message.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/flirt-and-play run dev` — run the frontend
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — session signing secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + TailwindCSS + shadcn/ui + wouter
- API: Express 5 + express-session + bcryptjs
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `lib/db/src/schema/` — Drizzle schema (users, rooms, games, flirt messages)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/flirt-and-play/src/` — React frontend

## Architecture decisions

- Contract-first: OpenAPI spec gates all codegen → hooks → frontend
- Session-based auth (express-session + connect-pg-simple) — cookies, no JWTs
- Game state stored as JSONB in PostgreSQL — flexible for 5 different game types
- Turn enforcement on server side — clients poll every 1.5s while game is active
- Flirt mechanic: loser sends message after game finishes, winner polls until received

## Product

5 multiplayer games (Tic Tac Toe, Connect Four, Rock Paper Scissors, Word Duel, Truth Spinner) in private rooms with invite codes. Loser of each game must send the winner a flirt message. Full game history and replay.

## Games

- **Tic Tac Toe** — classic 3×3
- **Connect Four** — drop discs, connect 4
- **Rock Paper Scissors** — best of 3 rounds (simultaneous choice)
- **Word Duel** — Wordle-style: one player sets a 5-letter secret, the other guesses
- **Truth Spinner** — spin the wheel, answer truths, rack up points

## Gotchas

- Always run codegen after changing `lib/api-spec/openapi.yaml`
- `pnpm --filter @workspace/db run push` after schema changes
- Game state is stored as `boardState` JSONB — each game type has its own structure
- RPS is simultaneous: both players can move in the same round
- Word Duel phase: `setting` (playerX sets word) → `guessing` (playerO guesses)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
