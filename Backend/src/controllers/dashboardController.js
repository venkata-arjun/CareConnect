import pool from "../config/db.js";

const riskLabels = ["HIGH", "MEDIUM", "LOW"];

function toCount(value) {
  return Number(value || 0);
}

export async function getDashboard(req, res) {
  try {
    const [metricsResult, riskResult, coordinatorResult, completionResult] =
      await Promise.all([
        pool.query(`
          SELECT
            (SELECT COUNT(*) FROM follow_ups) AS "totalFollowUps",
            (SELECT COUNT(*) FROM patients WHERE risk_category = 'HIGH') AS "highRiskPatients",
            (SELECT COUNT(*) FROM follow_ups WHERE status = 'Pending') AS "pendingFollowUps",
            (SELECT COUNT(*) FROM follow_ups WHERE status = 'Completed') AS "completedFollowUps",
            (SELECT COUNT(*) FROM call_activities WHERE call_outcome = 'Successfully Contacted') AS "successfulCalls",
            (SELECT COUNT(*) FROM call_activities WHERE call_outcome = 'Call Not Answered') AS "unsuccessfulAttempts",
            (SELECT COUNT(*) FROM call_activities WHERE next_action = 'Additional Action Required') AS "requiringAdditionalAction"
        `),
        pool.query(`
          SELECT risk_category AS label, COUNT(*) AS value
          FROM patients
          GROUP BY risk_category
        `),
        pool.query(`
          SELECT u.name AS label, COUNT(f.id) AS value, MIN(u.id) AS sort_id
          FROM users u
          LEFT JOIN follow_ups f ON f.coordinator_id = u.id
          WHERE u.role = 'coordinator'
          GROUP BY u.name
          ORDER BY sort_id
        `),
        pool.query(`
          SELECT status, COUNT(*) AS value
          FROM follow_ups
          GROUP BY status
        `),
      ]);

    const metricRow = metricsResult.rows[0];
    const riskCounts = new Map(
      riskResult.rows.map((row) => [row.label, toCount(row.value)]),
    );
    const completionCounts = new Map(
      completionResult.rows.map((row) => [row.status, toCount(row.value)]),
    );

    res.json({
      success: true,
      data: {
        metrics: {
          totalFollowUps: toCount(metricRow.totalFollowUps),
          highRiskPatients: toCount(metricRow.highRiskPatients),
          pendingFollowUps: toCount(metricRow.pendingFollowUps),
          completedFollowUps: toCount(metricRow.completedFollowUps),
          successfulCalls: toCount(metricRow.successfulCalls),
          unsuccessfulAttempts: toCount(metricRow.unsuccessfulAttempts),
          requiringAdditionalAction: toCount(
            metricRow.requiringAdditionalAction,
          ),
        },
        riskDistribution: riskLabels.map((label) => ({
          label,
          value: riskCounts.get(label) || 0,
        })),
        coordinatorDistribution: coordinatorResult.rows.map((row) => ({
          label: row.label,
          value: toCount(row.value),
        })),
        completionStatus: [
          {
            label: "Done",
            value: completionCounts.get("Completed") || 0,
          },
          {
            label: "Pending",
            value: completionCounts.get("Pending") || 0,
          },
        ],
      },
    });
  } catch (error) {
    console.error(
      "Failed to retrieve dashboard data:",
      error.code || "unknown error",
    );
    res.status(500).json({
      success: false,
      message: "Failed to retrieve dashboard data",
    });
  }
}
