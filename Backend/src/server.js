import "dotenv/config";
import app from "./app.js";
import pool from "./config/db.js";

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`CareConnect API running on port ${PORT}`);

  try {
    await pool.query("SELECT NOW()");
    console.log("PostgreSQL database connected");
  } catch (error) {
    console.error(
      "PostgreSQL database connection failed:",
      error.code || "unknown error",
    );
  }
});
