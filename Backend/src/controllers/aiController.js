import pool from "../config/db.js";
import { generateFollowUpSummary } from "../services/aiService.js";

const allowedOutcomes = new Set([
  "Successfully Contacted",
  "Call Not Answered",
  "Requested Callback",
  "Follow-Up Required",
  "Other",
]);

const allowedNextActions = new Set([
  "Complete Follow-Up",
  "Schedule Another Follow-Up",
  "Additional Action Required",
]);

function sendAiUnavailable(res, error) {
  console.error(
    "AI follow-up summary failed:",
    error.code || error.name || "unknown error",
  );
  res.status(503).json({
    success: false,
    message: "AI assistance temporarily unavailable",
  });
}

export async function generateFollowUpSummaryController(req, res) {
  const { patientId, followUpId, callOutcome, coordinatorNotes, nextAction } =
    req.body;

  if (!patientId || !followUpId || !callOutcome || !coordinatorNotes) {
    res.status(400).json({
      success: false,
      message:
        "patientId, followUpId, callOutcome, and coordinatorNotes are required",
    });
    return;
  }

  if (
    typeof coordinatorNotes !== "string" ||
    coordinatorNotes.trim().length < 10
  ) {
    res.status(400).json({
      success: false,
      message: "Coordinator notes must contain at least 10 characters",
    });
    return;
  }

  const numericFollowUpId = Number(followUpId);
  if (!Number.isInteger(numericFollowUpId) || numericFollowUpId < 1) {
    res.status(400).json({
      success: false,
      message: "Invalid follow-up ID",
    });
    return;
  }

  if (!allowedOutcomes.has(callOutcome)) {
    res.status(400).json({
      success: false,
      message: "Invalid call outcome",
    });
    return;
  }

  if (
    nextAction !== undefined &&
    nextAction !== null &&
    !allowedNextActions.has(nextAction)
  ) {
    res.status(400).json({
      success: false,
      message: "Invalid next action",
    });
    return;
  }

  let patient;

  try {
    const patientResult = await pool.query(
      `
        SELECT patient_id, name, diagnosis, risk_score, risk_category, id
        FROM patients
        WHERE patient_id = $1
      `,
      [patientId],
    );

    if (patientResult.rowCount === 0) {
      res.status(404).json({
        success: false,
        message: "Patient not found",
      });
      return;
    }

    const followUpResult = await pool.query(
      "SELECT id, patient_id FROM follow_ups WHERE id = $1",
      [numericFollowUpId],
    );

    if (followUpResult.rowCount === 0) {
      res.status(404).json({
        success: false,
        message: "Follow-up not found",
      });
      return;
    }

    patient = patientResult.rows[0];
    if (followUpResult.rows[0].patient_id !== patient.id) {
      res.status(400).json({
        success: false,
        message: "Follow-up does not belong to patient",
      });
      return;
    }
  } catch (error) {
    console.error(
      "Failed to prepare AI follow-up summary:",
      error.code || "unknown error",
    );
    res.status(500).json({
      success: false,
      message: "Failed to prepare AI follow-up summary",
    });
    return;
  }

  try {
    const result = await generateFollowUpSummary({
      patient,
      callOutcome,
      coordinatorNotes: coordinatorNotes.trim(),
      nextAction,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    sendAiUnavailable(res, error);
  }
}
