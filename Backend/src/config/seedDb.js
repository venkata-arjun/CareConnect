import "dotenv/config";
import bcrypt from "bcryptjs";
import pool from "./db.js";

const users = [
  {
    name: "Coordinator A",
    email: "coordinator@careconnect.com",
    password: "Coordinator@20810",
    role: "coordinator",
  },
  {
    name: "Coordinator B",
    email: "coordinator.b@careconnect.local",
    role: "coordinator",
  },
  {
    name: "Coordinator C",
    email: "coordinator.c@careconnect.local",
    role: "coordinator",
  },
];

const patients = [
  {
    patientId: "P1001",
    name: "John Smith",
    phone: "(555) 019-2831",
    email: "john.smith@example.com",
    dischargeDate: "2026-09-08",
    diagnosis: "Post-operative recovery / Cardiac observation",
    riskScore: 92,
    riskCategory: "HIGH",
    status: "Pending",
    previousFollowUp: "None (initial post-discharge call)",
    lastContact: "N/A",
    nextAction: "Conduct Outreach Call",
    riskFactors: [
      "High clinical complexity",
      "Multiple post-discharge prescription changes",
      "Previous readmission within 90 days",
    ],
  },
  {
    patientId: "P1002",
    name: "Sarah Lee",
    phone: "(555) 019-2842",
    email: "sarah.lee@example.com",
    dischargeDate: "2026-09-08",
    diagnosis: "Post-operative recovery",
    riskScore: 81,
    riskCategory: "HIGH",
    status: "Pending",
    previousFollowUp: "None",
    lastContact: "N/A",
    nextAction: "Conduct Outreach Call",
    riskFactors: ["Multiple medications", "Recent procedure"],
  },
  {
    patientId: "P1003",
    name: "David Kumar",
    phone: "(555) 019-2851",
    email: "david.kumar@example.com",
    dischargeDate: "2026-09-07",
    diagnosis: "Cardiac observation",
    riskScore: 67,
    riskCategory: "MEDIUM",
    status: "Pending",
    previousFollowUp: "None",
    lastContact: "N/A",
    nextAction: "Conduct Outreach Call",
    riskFactors: ["Moderate clinical complexity"],
  },
  {
    patientId: "P1004",
    name: "Emily Brown",
    phone: "(555) 019-2862",
    email: "emily.brown@example.com",
    dischargeDate: "2026-09-06",
    diagnosis: "Post-operative recovery",
    riskScore: 42,
    riskCategory: "LOW",
    status: "Completed",
    previousFollowUp: "Completed",
    lastContact: "08 Sep 2026",
    nextAction: "None",
    riskFactors: [],
  },
];

const followUpDefinitions = [
  {
    patientId: "P1001",
    coordinatorEmail: "coordinator@careconnect.com",
    status: "Pending",
    nextAction: "Conduct Outreach Call",
  },
  {
    patientId: "P1002",
    coordinatorEmail: "coordinator.b@careconnect.local",
    status: "Pending",
    nextAction: "Conduct Outreach Call",
  },
  {
    patientId: "P1003",
    coordinatorEmail: "coordinator.c@careconnect.local",
    status: "Pending",
    nextAction: "Conduct Outreach Call",
  },
  {
    patientId: "P1004",
    coordinatorEmail: "coordinator@careconnect.com",
    status: "Completed",
    nextAction: "None",
  },
];

const activities = [
  {
    occurredAt: "2026-09-10 14:30:00+00",
    coordinatorEmail: "coordinator@careconnect.com",
    callOutcome: "Successfully Contacted",
    coordinatorNotes: "Patient confusion over BP meds",
    nextAction: "Schedule Another Follow-Up",
    aiSummary: "Medication difficulty reported",
    aiGuidance:
      "Follow-up should be reviewed promptly based on concerns documented during the call.",
    status: "Pending",
  },
  {
    occurredAt: "2026-09-08 10:15:00+00",
    coordinatorEmail: "coordinator.b@careconnect.local",
    callOutcome: "Call Not Answered",
    coordinatorNotes: "Left voicemail on primary mobile",
    nextAction: "Schedule Another Follow-Up",
    aiSummary: "N/A – unsuccessful contact",
    aiGuidance: null,
    status: "Pending",
  },
  {
    occurredAt: "2026-09-06 16:00:00+00",
    coordinatorEmail: null,
    callOutcome: "Auto Discharge",
    coordinatorNotes: "Patient discharged from inpatient care",
    nextAction: null,
    aiSummary: "Initial risk score generated (92)",
    aiGuidance: null,
    status: "Completed",
  },
];

async function upsertUser(client, user) {
  const passwordHash = user.password
    ? await bcrypt.hash(user.password, 12)
    : null;
  const result = await client.query(
    `
      INSERT INTO users (name, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO UPDATE
        SET name = EXCLUDED.name,
            role = EXCLUDED.role,
            password_hash = COALESCE(EXCLUDED.password_hash, users.password_hash)
      RETURNING id
    `,
    [user.name, user.email, passwordHash, user.role],
  );

  return result.rows[0].id;
}

async function upsertPatient(client, patient) {
  const result = await client.query(
    `
      INSERT INTO patients (
        patient_id, name, phone, email, discharge_date, diagnosis,
        risk_score, risk_category, status, previous_follow_up, last_contact,
        next_action, risk_factors
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb)
      ON CONFLICT (patient_id) DO UPDATE SET
        name = EXCLUDED.name,
        phone = EXCLUDED.phone,
        email = EXCLUDED.email,
        discharge_date = EXCLUDED.discharge_date,
        diagnosis = EXCLUDED.diagnosis,
        risk_score = EXCLUDED.risk_score,
        risk_category = EXCLUDED.risk_category,
        status = EXCLUDED.status,
        previous_follow_up = EXCLUDED.previous_follow_up,
        last_contact = EXCLUDED.last_contact,
        next_action = EXCLUDED.next_action,
        risk_factors = EXCLUDED.risk_factors
      RETURNING id
    `,
    [
      patient.patientId,
      patient.name,
      patient.phone,
      patient.email,
      patient.dischargeDate,
      patient.diagnosis,
      patient.riskScore,
      patient.riskCategory,
      patient.status,
      patient.previousFollowUp,
      patient.lastContact,
      patient.nextAction,
      JSON.stringify(patient.riskFactors),
    ],
  );

  return result.rows[0].id;
}

async function findOrCreateFollowUp(
  client,
  followUp,
  patientId,
  coordinatorId,
) {
  const existing = await client.query(
    "SELECT id FROM follow_ups WHERE patient_id = $1 ORDER BY id LIMIT 1",
    [patientId],
  );

  if (existing.rowCount > 0) {
    await client.query(
      "UPDATE follow_ups SET coordinator_id = $1, status = $2, next_action = $3 WHERE id = $4",
      [
        coordinatorId,
        followUp.status,
        followUp.nextAction,
        existing.rows[0].id,
      ],
    );
    return existing.rows[0].id;
  }

  const result = await client.query(
    `
      INSERT INTO follow_ups (patient_id, coordinator_id, status, next_action)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `,
    [patientId, coordinatorId, followUp.status, followUp.nextAction],
  );

  return result.rows[0].id;
}

async function insertActivity(client, activity, followUpId, coordinatorId) {
  const existing = await client.query(
    `
      SELECT id
      FROM call_activities
      WHERE follow_up_id = $1
        AND created_at = $2
        AND call_outcome = $3
      LIMIT 1
    `,
    [followUpId, activity.occurredAt, activity.callOutcome],
  );

  if (existing.rowCount > 0) {
    return existing.rows[0].id;
  }

  const result = await client.query(
    `
      INSERT INTO call_activities (
        follow_up_id, coordinator_id, call_outcome, coordinator_notes,
        next_action, ai_summary, ai_guidance, status, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `,
    [
      followUpId,
      coordinatorId,
      activity.callOutcome,
      activity.coordinatorNotes,
      activity.nextAction,
      activity.aiSummary,
      activity.aiGuidance,
      activity.status,
      activity.occurredAt,
    ],
  );

  return result.rows[0].id;
}

async function updateCallOutcomeConstraint(client) {
  await client.query(
    "ALTER TABLE call_activities DROP CONSTRAINT IF EXISTS call_activities_call_outcome_check",
  );
  await client.query(`
    ALTER TABLE call_activities
    ADD CONSTRAINT call_activities_call_outcome_check CHECK (
      call_outcome IN (
        'Successfully Contacted',
        'Call Not Answered',
        'Requested Callback',
        'Follow-Up Required',
        'Auto Discharge',
        'Other'
      )
    )
  `);
}

let client;

try {
  client = await pool.connect();
  await client.query("BEGIN");
  await updateCallOutcomeConstraint(client);

  const userIds = new Map();
  for (const user of users) {
    userIds.set(user.email, await upsertUser(client, user));
  }

  const patientIds = new Map();
  for (const patient of patients) {
    patientIds.set(patient.patientId, await upsertPatient(client, patient));
  }

  const followUpIds = new Map();
  for (const followUp of followUpDefinitions) {
    const patientId = patientIds.get(followUp.patientId);
    const coordinatorId = userIds.get(followUp.coordinatorEmail);
    followUpIds.set(
      followUp.patientId,
      await findOrCreateFollowUp(client, followUp, patientId, coordinatorId),
    );
  }

  const johnFollowUpId = followUpIds.get("P1001");
  for (const activity of activities) {
    const coordinatorId = activity.coordinatorEmail
      ? userIds.get(activity.coordinatorEmail)
      : null;
    await insertActivity(client, activity, johnFollowUpId, coordinatorId);
  }

  await client.query("COMMIT");
  console.log("CareConnect database seeded successfully");
} catch (error) {
  if (client) {
    await client.query("ROLLBACK");
  }
  console.error("Database seed failed:", error.code || "unknown error");
  process.exitCode = 1;
} finally {
  client?.release();
  await pool.end();
}
