import { Router } from "express";
import { generateFollowUpSummaryController } from "../controllers/aiController.js";

const router = Router();

router.post("/", generateFollowUpSummaryController);

export default router;
