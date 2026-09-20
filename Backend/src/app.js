import cors from "cors";
import express from "express";
import pool from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import callRoutes from "./routes/callRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import followUpRoutes from "./routes/followUpRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";
import { authenticateToken } from "./middleware/authMiddleware.js";

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/ai/follow-up-summary", authenticateToken, aiRoutes);
app.use("/api", callRoutes);
app.use("/api/dashboard", authenticateToken, dashboardRoutes);
app.use("/api/patients", authenticateToken, patientRoutes);
app.use("/api/follow-ups", authenticateToken, followUpRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "CareConnect API is running",
  });
});

app.get("/api/health/db", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT NOW()");

    res.json({
      success: true,
      message: "Database connected successfully",
      timestamp: rows[0].now,
    });
  } catch (error) {
    console.error(
      "Database health check failed:",
      error.code || "unknown error",
    );
    res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use((err, req, res, next) => {
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

export default app;
