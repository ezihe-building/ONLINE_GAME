import express, { type Express } from "express";
import cors from "cors";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pinoHttp from "pino-http";
import path from "path";
import { mkdirSync, existsSync } from "fs";
import router from "./routes";
import { logger } from "./lib/logger";
import { pool } from "@workspace/db";

const app: Express = express();
const isProd = process.env.NODE_ENV === "production";

// Trust the first proxy (required for secure cookies behind Render's load balancer)
if (isProd) {
  app.set("trust proxy", 1);
}

// Ensure uploads dir exists and serve it statically under /api/uploads
const uploadsDir = path.join(process.cwd(), "uploads");
mkdirSync(uploadsDir, { recursive: true });
app.use("/api/uploads", express.static(uploadsDir));

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

app.use(cors({ credentials: true, origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PgSession = connectPgSimple(session);

app.use(
  session({
    store: new PgSession({
      pool,
      createTableIfMissing: false,
    }),
    secret: process.env.SESSION_SECRET || "flirt-and-play-dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  }),
);

// API routes
app.use("/api", router);

// In production, serve the pre-built frontend for all non-API routes.
// __dirname resolves to the compiled dist/ folder; frontend-dist sits one level up.
if (isProd) {
  const frontendDir = path.resolve(__dirname, "../frontend-dist");
  if (existsSync(frontendDir)) {
    app.use(express.static(frontendDir));
    // Catch-all: serve index.html for any unmatched route (SPA client-side routing)
    app.use((_req, res) => {
      res.sendFile(path.join(frontendDir, "index.html"));
    });
  } else {
    logger.warn({ frontendDir }, "frontend-dist not found — static serving disabled");
  }
}

export default app;
