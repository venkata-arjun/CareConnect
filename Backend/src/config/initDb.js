import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pool from "./db.js";

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);
const schemaPath = path.resolve(currentDirectory, "../../database/schema.sql");

try {
  const schema = await fs.readFile(schemaPath, "utf8");
  await pool.query(schema);
  console.log("CareConnect database schema initialized successfully");
} catch (error) {
  console.error(
    "Database schema initialization failed:",
    error.code || "unknown error",
  );
  process.exitCode = 1;
} finally {
  await pool.end();
}
