import { Router, type IRouter } from "express";
import authRouter from "./auth";
import candidatesRouter from "./candidates";
import healthRouter from "./health";
import jobsRouter from "./jobs";
import recruiterRouter from "./recruiter";
import recruiterCompanyRegistrationRouter from "./recruiter-company-registration";
import { config } from "../config";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(candidatesRouter);
router.use(jobsRouter);
router.use(recruiterCompanyRegistrationRouter);
if (config.recruiter.liveEnabled) {
  router.use(recruiterRouter);
}

export default router;
