import { Router, type IRouter } from "express";
import healthRouter from "./health";
import storageRouter from "./storage";
import authRouter from "./auth";
import usersRouter from "./users";
import roomsRouter from "./rooms";
import gamesRouter from "./games";
import flirtRouter from "./flirt";

const router: IRouter = Router();

router.use(healthRouter);
router.use(storageRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(roomsRouter);
router.use(gamesRouter);
router.use(flirtRouter);

export default router;
