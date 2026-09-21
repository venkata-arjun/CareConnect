import pool from "../config/db.js";

const followUpSelect = `
  SELECT
    f.id,
    p.patient_id,
    p.name AS patient_name,
    u.name AS coordinator,
    f.status,
    f.scheduled_at,
    f.next_action,
    f.created_at,
    f.updated_at,
    p.risk_score,
    p.risk_category,
    p.discharge_date
  FROM follow_ups f
  JOIN patients p ON f.patient_id = p.id
  LEFT JOIN users u ON f.coordinator_id = u.id
`;

const allowedStatuses = new Set(["Pending", "Completed"]);

function parseFollowUpId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function sendDatabaseError(res, message, error) {
  console.error(message + ":", error.code || "unknown error");
  res.status(500).json({
    success: false,
    message,
  });
}

async function getFollowUp(client, id) {
  const { rows } = await client.query(`${followUpSelect} WHERE f.id = $1`, [
    id,
  ]);
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

async function syncPatientStatus(client, patientId) {
  await client.query(
    `
      UPDATE patients
      SET status = (
        SELECT CASE
          WHEN f.status = 'Completed' THEN 'Completed'
          WHEN f.next_action = 'Schedule Another Follow-Up'
            AND f.scheduled_at IS NOT NULL THEN 'Follow-up'
          ELSE 'Pending'
        END
        FROM follow_ups f
        WHERE f.patient_id = $1
        ORDER BY f.created_at DESC, f.id DESC
        LIMIT 1
      ), updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `,
    [patientId],
  );
}

export async function getFollowUps(req, res) {
  try {
    const { rows } = await pool.query(
      `${followUpSelect} ORDER BY p.risk_score DESC, f.created_at DESC`,
    );

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    sendDatabaseError(res, "Failed to retrieve follow-ups", error);
  }
}

export async function getFollowUpById(req, res) {
  const id = parseFollowUpId(req.params.id);

  if (!id) {
    res.status(404).json({
      success: false,
      message: "Follow-up not found",
    });
    return;
  }

  try {
    const followUp = await getFollowUp(pool, id);

    if (!followUp) {
      res.status(404).json({
        success: false,
        message: "Follow-up not found",
      });
      return;
    }

    res.json({
      success: true,
      data: followUp,
    });
  } catch (error) {
    sendDatabaseError(res, "Failed to retrieve follow-up", error);
  }
}

export async function createFollowUp(req, res) {
  const { patientId, coordinatorId, status, scheduledAt, nextAction } =
    req.body;
  const authenticatedCoordinatorId = req.user.userId;

  if (!patientId || !status || !nextAction) {
    res.status(400).json({
      success: false,
      message: "patientId, status, and nextAction are required",
    });
    return;
  }

  if (!allowedStatuses.has(status)) {
    res.status(400).json({
      success: false,
      message: "Invalid follow-up status",
    });
    return;
  }

  let client;

  try {
    client = await pool.connect();
    await client.query("BEGIN");

    const patientResult = await client.query(
      "SELECT id FROM patients WHERE patient_id = $1",
      [patientId],
    );

    if (patientResult.rowCount === 0) {
      await client.query("ROLLBACK");
      res.status(404).json({
        success: false,
        message: "Patient not found",
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
        INSERT INTO follow_ups (patient_id, coordinator_id, status, scheduled_at, next_action)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `,
      [
        patientResult.rows[0].id,
        authenticatedCoordinatorId,
        status,
        status === "Completed" ? null : scheduledAt ?? null,
        nextAction,
      ],
    );

    const followUp = await getFollowUp(client, insertResult.rows[0].id);
    await syncPatientStatus(client, patientResult.rows[0].id);
    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Follow-up created successfully",
      data: followUp,
    });
  } catch (error) {
    if (client) {
      await client.query("ROLLBACK");
    }
    sendDatabaseError(res, "Failed to create follow-up", error);
  } finally {
    client?.release();
  }
}

export async function updateFollowUp(req, res) {
  const id = parseFollowUpId(req.params.id);
  const { coordinatorId, status, scheduledAt, nextAction } = req.body;
  const authenticatedCoordinatorId = req.user.userId;

  if (!id) {
    res.status(404).json({
      success: false,
      message: "Follow-up not found",
    });
    return;
  }

  if (!status || !nextAction) {
    res.status(400).json({
      success: false,
      message: "status and nextAction are required",
    });
    return;
  }

  if (!allowedStatuses.has(status)) {
    res.status(400).json({
      success: false,
      message: "Invalid follow-up status",
    });
    return;
  }

  let client;

  try {
    client = await pool.connect();
    await client.query("BEGIN");

    const existing = await client.query(
      "SELECT id, patient_id FROM follow_ups WHERE id = $1",
      [id],
    );

    if (existing.rowCount === 0) {
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

    await client.query(
      `
        UPDATE follow_ups
        SET coordinator_id = $1,
            status = $2,
            scheduled_at = $3,
            next_action = $4,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
      `,
      [
        authenticatedCoordinatorId,
        status,
        status === "Completed" ? null : scheduledAt ?? null,
        nextAction,
        id,
      ],
    );

    await syncPatientStatus(client, existing.rows[0].patient_id);
    const followUp = await getFollowUp(client, id);
    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Follow-up updated successfully",
      data: followUp,
    });
  } catch (error) {
    if (client) {
      await client.query("ROLLBACK");
    }
    sendDatabaseError(res, "Failed to update follow-up", error);
  } finally {
    client?.release();
  }
}

export async function updateFollowUpStatus(req, res) {
  const id = parseFollowUpId(req.params.id);
  const { status } = req.body;

  if (!id) {
    res.status(404).json({
      success: false,
      message: "Follow-up not found",
    });
    return;
  }

  if (!allowedStatuses.has(status)) {
    res.status(400).json({
      success: false,
      message: "Invalid follow-up status",
    });
    return;
  }

  let client;

  try {
    client = await pool.connect();
    await client.query("BEGIN");

    const result = await client.query(
      `
        UPDATE follow_ups
        SET status = $1,
            scheduled_at = CASE WHEN $1 = 'Completed' THEN NULL ELSE scheduled_at END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING id, patient_id
      `,
      [status, id],
    );

    if (result.rowCount === 0) {
      res.status(404).json({
        success: false,
        message: "Follow-up not found",
      });
      return;
    }

    await syncPatientStatus(client, result.rows[0].patient_id);
    const followUp = await getFollowUp(client, id);
    await client.query("COMMIT");
    res.json({
      success: true,
      message: "Follow-up status updated successfully",
      data: followUp,
    });
  } catch (error) {
    if (client) {
      await client.query("ROLLBACK");
    }
    sendDatabaseError(res, "Failed to update follow-up status", error);
  } finally {
    client?.release();
  }
}

export async function deleteFollowUp(req, res) {
  const id = parseFollowUpId(req.params.id);

  if (!id) {
    res.status(404).json({
      success: false,
      message: "Follow-up not found",
    });
    return;
  }

  try {
    const result = await pool.query(
      "DELETE FROM follow_ups WHERE id = $1 RETURNING id",
      [id],
    );

    if (result.rowCount === 0) {
      res.status(404).json({
        success: false,
        message: "Follow-up not found",
      });
      return;
    }

    res.json({
      success: true,
      message: "Follow-up deleted successfully",
    });
  } catch (error) {
    sendDatabaseError(res, "Failed to delete follow-up", error);
  }
}
