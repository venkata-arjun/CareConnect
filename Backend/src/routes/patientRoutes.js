import { Router } from "express";
import {
  createPatient,
  getPatientById,
  getPatientRisk,
  getPatients,
  updatePatient,
} from "../controllers/patientController.js";

const router = Router();

router.post("/", createPatient);
router.get("/", getPatients);
router.get("/:patientId/risk", getPatientRisk);
router.patch("/:patientId", updatePatient);
router.get("/:patientId", getPatientById);

export default router;
