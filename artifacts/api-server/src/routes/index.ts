import { Router, type IRouter } from "express";
import authRouter from "./auth";
import candidatesRouter from "./candidates";
import healthRouter from "./health";
import jobsRouter from "./jobs";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(candidatesRouter);
router.use(jobsRouter);

export default router;
