import { Router } from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import {
  createCall,
  deleteCall,
  getCallById,
  getPatientCalls,
  updateCall,
  updateCallOutcome,
} from "../controllers/callController.js";

const router = Router();

router.get("/patients/:patientId/calls", authenticateToken, getPatientCalls);
router.get("/calls/:id", authenticateToken, getCallById);
router.post("/calls", authenticateToken, createCall);
router.put("/calls/:id", authenticateToken, updateCall);
router.patch("/calls/:id/outcome", authenticateToken, updateCallOutcome);
router.delete("/calls/:id", authenticateToken, deleteCall);

export default router;
