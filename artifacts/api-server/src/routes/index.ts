import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import roomsRouter from "./rooms";
import gamesRouter from "./games";
import flirtRouter from "./flirt";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(roomsRouter);
router.use(gamesRouter);
router.use(flirtRouter);

export default router;
