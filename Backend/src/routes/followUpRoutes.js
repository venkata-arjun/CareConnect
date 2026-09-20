import { Router } from "express";
import {
  createFollowUp,
  deleteFollowUp,
  getFollowUpById,
  getFollowUps,
  updateFollowUp,
  updateFollowUpStatus,
} from "../controllers/followUpController.js";

const router = Router();

router.get("/", getFollowUps);
router.get("/:id", getFollowUpById);
router.post("/", createFollowUp);
router.put("/:id", updateFollowUp);
router.patch("/:id/status", updateFollowUpStatus);
router.delete("/:id", deleteFollowUp);

export default router;
