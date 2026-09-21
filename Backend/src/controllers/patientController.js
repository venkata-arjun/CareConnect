import pool from "../config/db.js";

const patientFields = `
  patient_id,
  name,
  phone,
  email,
  discharge_date,
  diagnosis,
  risk_score,
  risk_category,
  status,
  previous_follow_up,
  last_contact,
  next_action,
  risk_factors,
  updated_at
`;

const allowedRiskCategories = new Set(["HIGH", "MEDIUM", "LOW"]);
function validatePatientInput(input, { partial = false } = {}) {
  const requiredFields = [
    ["patientId", input.patientId],
    ["name", input.name],
    ["phone", input.phone],
    ["email", input.email],
    ["dischargeDate", input.dischargeDate],
    ["diagnosis", input.diagnosis],
    ["riskScore", input.riskScore],
    ["riskCategory", input.riskCategory],
  ];

  if (!partial) {
    const missing = requiredFields.find(
      ([, value]) => value === undefined || value === null || value === "",
    );
    if (missing) return `${missing[0]} is required`;
  }

  if (input.email !== undefined && !/^\S+@\S+\.\S+$/.test(input.email)) {
    return "Invalid email";
  }

  if (input.riskScore !== undefined) {
    const score = Number(input.riskScore);
    if (!Number.isInteger(score) || score < 0 || score > 100) {
      return "Risk score must be between 0 and 100";
    }
  }

  if (
    input.riskCategory !== undefined &&
    !allowedRiskCategories.has(input.riskCategory)
  ) {
    return "Invalid risk category";
  }

  if (input.riskFactors !== undefined && !Array.isArray(input.riskFactors)) {
    return "Risk factors must be an array";
  }

  return null;
}

function patientResponse(row) {
  return row;
}

export async function createPatient(req, res) {
  const input = req.body;
  const validationError = validatePatientInput(input);

  if (validationError) {
    res.status(400).json({ success: false, message: validationError });
    return;
  }

  try {
    const { rows } = await pool.query(
      `
        INSERT INTO patients (
          patient_id, name, phone, email, discharge_date, diagnosis,
          risk_score, risk_category, status, previous_follow_up,
          last_contact, next_action, risk_factors
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb)
        RETURNING ${patientFields}
      `,
      [
        input.patientId.trim(),
        input.name.trim(),
        input.phone.trim(),
        input.email.trim().toLowerCase(),
        input.dischargeDate,
        input.diagnosis.trim(),
        Number(input.riskScore),
        input.riskCategory,
        "Pending",
        input.previousFollowUp || null,
        input.lastContact || null,
        input.nextAction || "Conduct Outreach Call",
        JSON.stringify(input.riskFactors || []),
      ],
    );

    res.status(201).json({
      success: true,
      message: "Patient created successfully",
      data: patientResponse(rows[0]),
    });
  } catch (error) {
    if (error.code === "23505") {
      res.status(409).json({
        success: false,
        message: "Patient ID already exists",
      });
      return;
    }

    console.error("Failed to create patient:", error.code || "unknown error");
    res.status(500).json({
      success: false,
      message: "Failed to create patient",
    });
  }
}

export async function updatePatient(req, res) {
  const validationError = validatePatientInput(req.body, { partial: true });

  if (validationError) {
    res.status(400).json({ success: false, message: validationError });
    return;
  }

  const fields = {
    name: req.body.name,
    phone: req.body.phone,
    email: req.body.email?.trim().toLowerCase(),
    discharge_date: req.body.dischargeDate,
    diagnosis: req.body.diagnosis,
    risk_score:
      req.body.riskScore === undefined ? undefined : Number(req.body.riskScore),
    risk_category: req.body.riskCategory,
    previous_follow_up: req.body.previousFollowUp,
    last_contact: req.body.lastContact,
    next_action: req.body.nextAction,
    risk_factors:
      req.body.riskFactors === undefined
        ? undefined
        : JSON.stringify(req.body.riskFactors),
  };
  const entries = Object.entries(fields).filter(
    ([, value]) => value !== undefined,
  );

  if (entries.length === 0) {
    res
      .status(400)
      .json({ success: false, message: "No patient fields supplied" });
    return;
  }

  const values = entries.map(([, value]) => value);
  const assignments = entries.map(
    ([field], index) =>
      `${field} = $${index + 1}${field === "risk_factors" ? "::jsonb" : ""}`,
  );
  values.push(req.params.patientId);

  try {
    const { rows } = await pool.query(
      `
        UPDATE patients
        SET ${assignments.join(", ")}, updated_at = CURRENT_TIMESTAMP
        WHERE patient_id = $${values.length}
        RETURNING ${patientFields}
      `,
      values,
    );

    if (rows.length === 0) {
      res.status(404).json({ success: false, message: "Patient not found" });
      return;
    }

    res.json({
      success: true,
      message: "Patient updated successfully",
      data: patientResponse(rows[0]),
    });
  } catch (error) {
    console.error("Failed to update patient:", error.code || "unknown error");
    res.status(500).json({
      success: false,
      message: "Failed to update patient",
    });
  }
}

export async function getPatients(req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT
        ${patientFields},
        (
          SELECT f.scheduled_at
          FROM follow_ups f
          WHERE f.patient_id = patients.id
            AND f.scheduled_at IS NOT NULL
            AND f.status = 'Pending'
          ORDER BY f.scheduled_at ASC
          LIMIT 1
        ) AS next_follow_up_date
      FROM patients
      ORDER BY risk_score DESC
    `);

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error(
      "Failed to retrieve patients:",
      error.code || "unknown error",
    );
    res.status(500).json({
      success: false,
      message: "Failed to retrieve patient data",
    });
  }
}

export async function getPatientById(req, res) {
  try {
    const { rows } = await pool.query(
      `
        SELECT
          p.patient_id,
          p.name,
          p.phone,
          p.email,
          p.discharge_date,
          p.diagnosis,
          p.risk_score,
          p.risk_category,
          p.status,
          p.previous_follow_up,
          p.last_contact,
          p.next_action,
          p.risk_factors,
          COALESCE(
            json_agg(
              json_build_object(
                'id', f.id,
                'status', f.status,
                'scheduled_at', f.scheduled_at,
                'next_action', f.next_action,
                'coordinator_id', f.coordinator_id
              ) ORDER BY f.created_at DESC
            ) FILTER (WHERE f.id IS NOT NULL),
            '[]'::json
          ) AS follow_ups
        FROM patients p
        LEFT JOIN follow_ups f ON f.patient_id = p.id
        WHERE p.patient_id = $1
        GROUP BY p.id
      `,
      [req.params.patientId],
    );

    if (rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "Patient not found",
      });
      return;
    }

    res.json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error("Failed to retrieve patient:", error.code || "unknown error");
    res.status(500).json({
      success: false,
      message: "Failed to retrieve patient data",
    });
  }
}

export async function getPatientRisk(req, res) {
  try {
    const { rows } = await pool.query(
      `
        SELECT patient_id, risk_score, risk_category, risk_factors
        FROM patients
        WHERE patient_id = $1
      `,
      [req.params.patientId],
    );

    if (rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "Patient not found",
      });
      return;
    }

    res.json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error(
      "Failed to retrieve patient risk:",
      error.code || "unknown error",
    );
    res.status(500).json({
      success: false,
      message: "Failed to retrieve patient data",
    });
  }
}
