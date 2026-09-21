import pool from "../config/db.js";

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

const allowedStatuses = new Set(["Pending", "Completed"]);

const callSelect = `
  SELECT
    c.id,
    p.patient_id,
    p.name AS patient_name,
    c.follow_up_id,
    u.name AS coordinator,
    c.call_outcome,
    c.coordinator_notes,
    c.next_action,
    c.ai_summary,
    c.ai_guidance,
    c.status,
    c.created_at,
    c.updated_at
  FROM call_activities c
  JOIN follow_ups f ON c.follow_up_id = f.id
  JOIN patients p ON f.patient_id = p.id
  LEFT JOIN users u ON c.coordinator_id = u.id
`;

function parseCallId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function sendDatabaseError(res, message, error) {
  console.error(`${message}:`, error.code || "unknown error");
  res.status(500).json({
    success: false,
    message,
  });
}

async function getCall(client, id) {
  const { rows } = await client.query(`${callSelect} WHERE c.id = $1`, [id]);
  return rows[0] || null;
}

async function verifyCoordinator(client, coordinatorId) {
  if (coordinatorId === undefined || coordinatorId === null) {
    return true;
  }

  const result = await client.query("SELECT id FROM users WHERE id = $1", [
    coordinatorId,
  ]);
  return result.rowCount > 0;
}

async function syncPatientFollowUp(
  client,
  followUpId,
  status,
  nextAction,
  scheduledAt,
) {
  const nextFollowUpDate =
    nextAction === "Schedule Another Follow-Up" ? scheduledAt || null : null;
  const procedureStatus =
    nextAction === "Complete Follow-Up" ? "Completed" : "Pending";

  await client.query(
    `
      UPDATE follow_ups
      SET status = $1,
          scheduled_at = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `,
    [procedureStatus, nextFollowUpDate, followUpId],
  );

  const patientStatusResult = await client.query(
    `
      SELECT CASE
        WHEN EXISTS (
          SELECT 1
          FROM follow_ups f
          WHERE f.patient_id = (
            SELECT patient_id FROM follow_ups WHERE id = $1
          )
          AND f.status = 'Completed'
        ) THEN 'Completed'
        ELSE 'Pending'
      END AS patient_status
    `,
    [followUpId],
  );

  const patientStatus = patientStatusResult.rows[0]?.patient_status || "Pending";

  await client.query(
    `
      UPDATE patients
          SET status = $1::varchar,
            previous_follow_up = $2::text,
          last_contact = TO_CHAR(CURRENT_TIMESTAMP, 'DD Mon YYYY'),
          next_action = $3,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = (
        SELECT patient_id
        FROM follow_ups
        WHERE id = $4
      )
    `,
    [patientStatus, status, nextAction ?? null, followUpId],
  );
}

function validateCallFields({
  callOutcome,
  coordinatorNotes,
  nextAction,
  status,
}) {
  if (!callOutcome || typeof coordinatorNotes !== "string") {
    return "callOutcome and coordinatorNotes are required";
  }

  if (coordinatorNotes.trim().length < 10) {
    return "Coordinator notes must contain at least 10 characters";
  }

  if (!allowedOutcomes.has(callOutcome)) {
    return "Invalid call outcome";
  }

  if (
    nextAction !== undefined &&
    nextAction !== null &&
    !allowedNextActions.has(nextAction)
  ) {
    return "Invalid next action";
  }

  if (status !== undefined && !allowedStatuses.has(status)) {
    return "Invalid call activity status";
  }

  return null;
}

export async function getPatientCalls(req, res) {
  try {
    const patientResult = await pool.query(
      "SELECT id FROM patients WHERE patient_id = $1",
      [req.params.patientId],
    );

    if (patientResult.rowCount === 0) {
      res.status(404).json({
        success: false,
        message: "Patient not found",
      });
      return;
    }

    const { rows } = await pool.query(
      `${callSelect} WHERE p.patient_id = $1 ORDER BY c.created_at DESC`,
      [req.params.patientId],
    );

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    sendDatabaseError(res, "Failed to retrieve call activities", error);
  }
}

export async function getCallById(req, res) {
  const id = parseCallId(req.params.id);

  if (!id) {
    res.status(404).json({
      success: false,
      message: "Call activity not found",
    });
    return;
  }

  try {
    const call = await getCall(pool, id);

    if (!call) {
      res.status(404).json({
        success: false,
        message: "Call activity not found",
      });
      return;
    }

    res.json({
      success: true,
      data: call,
    });
  } catch (error) {
    sendDatabaseError(res, "Failed to retrieve call activity", error);
  }
}

export async function createCall(req, res) {
  const {
    followUpId,
    coordinatorId,
    callOutcome,
    coordinatorNotes,
    nextAction,
    scheduledAt,
    aiSummary,
    aiGuidance,
  } = req.body;
  const authenticatedCoordinatorId = req.user.userId;

  if (!followUpId || !callOutcome || !coordinatorNotes) {
    res.status(400).json({
      success: false,
      message: "followUpId, callOutcome, and coordinatorNotes are required",
    });
    return;
  }

  const validationMessage = validateCallFields({
    callOutcome,
    coordinatorNotes,
    nextAction,
  });

  if (validationMessage) {
    res.status(400).json({
      success: false,
      message: validationMessage,
    });
    return;
  }

  let client;

  try {
    client = await pool.connect();
    await client.query("BEGIN");

    const followUpResult = await client.query(
      "SELECT id FROM follow_ups WHERE id = $1",
      [followUpId],
    );

    if (followUpResult.rowCount === 0) {
      await client.query("ROLLBACK");
      res.status(404).json({
        success: false,
        message: "Follow-up not found",
      });
      return;
    }

    if (!(await verifyCoordinator(client, authenticatedCoordinatorId))) {
      await client.query("ROLLBACK");
      res.status(404).json({
        success: false,
        message: "Coordinator not found",
      });
      return;
    }

    const insertResult = await client.query(
      `
        INSERT INTO call_activities (
          follow_up_id,
          coordinator_id,
          call_outcome,
          coordinator_notes,
          next_action,
          ai_summary,
          ai_guidance
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `,
      [
        followUpId,
        authenticatedCoordinatorId,
        callOutcome,
        coordinatorNotes.trim(),
        nextAction ?? null,
        aiSummary ?? null,
        aiGuidance ?? null,
      ],
    );

    await syncPatientFollowUp(
      client,
      followUpId,
      "Pending",
      nextAction,
      scheduledAt,
    );

    const call = await getCall(client, insertResult.rows[0].id);
    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Call activity created successfully",
      data: call,
    });
  } catch (error) {
    if (client) {
      await client.query("ROLLBACK");
    }
    sendDatabaseError(res, "Failed to create call activity", error);
  } finally {
    client?.release();
  }
}

export async function updateCall(req, res) {
  const id = parseCallId(req.params.id);
  const {
    coordinatorId,
    callOutcome,
    coordinatorNotes,
    nextAction,
    scheduledAt,
    aiSummary,
    aiGuidance,
    status,
  } = req.body;
  const authenticatedCoordinatorId = req.user.userId;

  if (!id) {
    res.status(404).json({
      success: false,
      message: "Call activity not found",
    });
    return;
  }

  const validationMessage = validateCallFields({
    callOutcome,
    coordinatorNotes,
    nextAction,
    status,
  });

  if (validationMessage) {
    res.status(400).json({
      success: false,
      message: validationMessage,
    });
    return;
  }

  if (status === undefined) {
    res.status(400).json({
      success: false,
      message: "status is required",
    });
    return;
  }

  let client;

  try {
    client = await pool.connect();
    await client.query("BEGIN");

    const existing = await client.query(
      "SELECT id FROM call_activities WHERE id = $1",
      [id],
    );

    if (existing.rowCount === 0) {
      await client.query("ROLLBACK");
      res.status(404).json({
        success: false,
        message: "Call activity not found",
      });
      return;
    }

    if (!(await verifyCoordinator(client, authenticatedCoordinatorId))) {
      await client.query("ROLLBACK");
      res.status(404).json({
        success: false,
        message: "Coordinator not found",
      });
      return;
    }

    await client.query(
      `
        UPDATE call_activities
        SET coordinator_id = $1,
            call_outcome = $2,
            coordinator_notes = $3,
            next_action = $4,
            ai_summary = $5,
            ai_guidance = $6,
            status = $7,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $8
      `,
      [
        authenticatedCoordinatorId,
        callOutcome,
        coordinatorNotes.trim(),
        nextAction ?? null,
        aiSummary ?? null,
        aiGuidance ?? null,
        status,
        id,
      ],
    );

    const followUpResult = await client.query(
      "SELECT follow_up_id FROM call_activities WHERE id = $1",
      [id],
    );
    await syncPatientFollowUp(
      client,
      followUpResult.rows[0].follow_up_id,
      status,
      nextAction,
      scheduledAt,
    );

    const call = await getCall(client, id);
    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Call activity updated successfully",
      data: call,
    });
  } catch (error) {
    if (client) {
      await client.query("ROLLBACK");
    }
    sendDatabaseError(res, "Failed to update call activity", error);
  } finally {
    client?.release();
  }
}

export async function updateCallOutcome(req, res) {
  const id = parseCallId(req.params.id);
  const { callOutcome } = req.body;

  if (!id) {
    res.status(404).json({
      success: false,
      message: "Call activity not found",
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

  try {
    const result = await pool.query(
      `
        UPDATE call_activities
        SET call_outcome = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING id
      `,
      [callOutcome, id],
    );

    if (result.rowCount === 0) {
      res.status(404).json({
        success: false,
        message: "Call activity not found",
      });
      return;
    }

    const call = await getCall(pool, id);
    res.json({
      success: true,
      message: "Call outcome updated successfully",
      data: call,
    });
  } catch (error) {
    sendDatabaseError(res, "Failed to update call outcome", error);
  }
}

export async function deleteCall(req, res) {
  const id = parseCallId(req.params.id);

  if (!id) {
    res.status(404).json({
      success: false,
      message: "Call activity not found",
    });
    return;
  }

  try {
    const result = await pool.query(
      "DELETE FROM call_activities WHERE id = $1 RETURNING id",
      [id],
    );

    if (result.rowCount === 0) {
      res.status(404).json({
        success: false,
        message: "Call activity not found",
      });
      return;
    }

    res.json({
      success: true,
      message: "Call activity deleted successfully",
    });
  } catch (error) {
    sendDatabaseError(res, "Failed to delete call activity", error);
  }
}
