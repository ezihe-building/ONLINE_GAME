import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
import { existsSync } from "fs";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();
const isProd = process.env.NODE_ENV === "production";

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Serve frontend static files in production
if (isProd) {
  const staticDir = path.join(__dirname, "..", "frontend-dist");
  if (existsSync(staticDir)) {
    app.use(express.static(staticDir));
    // Express 5 compatible catch-all fallback for SPA client-side routing
    app.use((req, res) => {
      res.sendFile(path.join(staticDir, "index.html"));
    });
  }
}

export default app;
