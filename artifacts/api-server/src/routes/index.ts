import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import avatarRouter from "./avatar";
import roomsRouter from "./rooms";
import gamesRouter from "./games";
import flirtRouter from "./flirt";
import chatRouter from "./chat";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(avatarRouter);
router.use(roomsRouter);
router.use(gamesRouter);
router.use(flirtRouter);
router.use(chatRouter);

export default router;
