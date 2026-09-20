import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

function sendServerError(res, message, error) {
  console.error(`${message}:`, error.code || "unknown error");
  res.status(500).json({
    success: false,
    message,
  });
}

export async function register(req, res) {
  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  const email =
    typeof req.body.email === "string"
      ? req.body.email.trim().toLowerCase()
      : "";
  const password = req.body.password;

  if (!name || !email || typeof password !== "string") {
    res.status(400).json({
      success: false,
      message: "Name, email, and password are required",
    });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({
      success: false,
      message: "Password must contain at least 8 characters",
    });
    return;
  }

  try {
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email],
    );

    if (existingUser.rowCount > 0) {
      res.status(409).json({
        success: false,
        message: "User with this email already exists",
      });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `
        INSERT INTO users (name, email, password_hash)
        VALUES ($1, $2, $3)
        RETURNING id, name, email, role
      `,
      [name, email, passwordHash],
    );

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: publicUser(result.rows[0]),
    });
  } catch (error) {
    if (error.code === "23505") {
      res.status(409).json({
        success: false,
        message: "User with this email already exists",
      });
      return;
    }

    sendServerError(res, "Failed to register user", error);
  }
}

export async function login(req, res) {
  const email =
    typeof req.body.email === "string"
      ? req.body.email.trim().toLowerCase()
      : "";
  const password = req.body.password;

  if (!email || typeof password !== "string" || !password) {
    res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
    return;
  }

  try {
    const result = await pool.query(
      "SELECT id, name, email, password_hash, role FROM users WHERE email = $1",
      [email],
    );
    const user = result.rows[0];

    if (
      !user?.password_hash ||
      !(await bcrypt.compare(password, user.password_hash))
    ) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    if (!process.env.JWT_SECRET || !process.env.JWT_EXPIRES_IN) {
      sendServerError(
        res,
        "Authentication configuration is missing",
        new Error("JWT configuration missing"),
      );
      return;
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN },
    );

    res.json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: publicUser(user),
      },
    });
  } catch (error) {
    sendServerError(res, "Failed to log in", error);
  }
}
