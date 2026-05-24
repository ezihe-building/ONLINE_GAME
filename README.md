# Flirt & Play

A sexy multiplayer game platform where two people battle across 5 games — and the loser owes the winner a flirt message.

## Games

- **Tic Tac Toe** — classic 3×3
- **Connect Four** — drop discs, connect 4
- **Rock Paper Scissors** — best of 3 rounds
- **Word Duel** — Wordle-style: set a secret word, watch your opponent struggle
- **Truth Spinner** — spin the wheel, answer truths, rack up points

## Features

- Custom username/password accounts
- Private rooms with invite codes
- Strict turn enforcement — no cheating
- Win screen with flirt message mechanic
- Full game history & replay

---

## Deploy to Render.com

### Step 1 — Push to GitHub

Make sure this repo is on GitHub: `https://github.com/ezihe-building/ONLINE_GAME`

### Step 2 — Create a Render account

Go to [https://render.com](https://render.com) and sign up for free.

### Step 3 — Connect your GitHub repo

1. In your Render dashboard click **New → Blueprint**
2. Connect your GitHub account when prompted
3. Select the `ONLINE_GAME` repository
4. Render will automatically detect the `render.yaml` file in this repo

### Step 4 — Set environment variables

Render will auto-generate `SESSION_SECRET` and link `DATABASE_URL` from the attached Postgres database.

You do **not** need to set anything manually — `render.yaml` handles it all.

### Step 5 — Deploy

Click **Apply** and watch Render build and deploy your app. It typically takes 3–5 minutes.

Your app will be live at a URL like: `https://flirt-and-play.onrender.com`

> **Note:** On Render's free tier the server spins down after 15 minutes of inactivity. The first request after that may be slow (cold start). Upgrade to the Starter plan ($7/mo) to keep it always-on.

---

## Local Development

```bash
# Install dependencies
pnpm install

# Start API server (port 8080)
pnpm --filter @workspace/api-server run dev

# Start frontend (port auto-assigned)
pnpm --filter @workspace/flirt-and-play run dev
```

Required environment variable: `DATABASE_URL` (PostgreSQL connection string)

## Tech Stack

- **Frontend:** React + Vite + TailwindCSS
- **Backend:** Express 5 + Drizzle ORM
- **Database:** PostgreSQL
- **Auth:** bcryptjs + express-session
