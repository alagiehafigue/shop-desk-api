import bcrypt from "bcrypt";
import pool from "../../config/db.js";
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
} from "./token.js";

export const registerUser = async ({ name, email, password, role }) => {
  const hashedPassword = await bcrypt.hash(password, 10);

  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1,$2,$3,$4)
     RETURNING id,name,email,role`,
    [name, email, hashedPassword, role],
  );

  return result.rows[0];
};

export const loginUser = async ({ email, password }) => {
  const result = await pool.query(`SELECT * FROM users WHERE email=$1`, [
    email,
  ]);

  const user = result.rows[0];

  if (!user) {
    throw new Error("Invalid credentials");
  }

  const validPassword = await bcrypt.compare(password, user.password_hash);

  if (!validPassword) {
    throw new Error("Invalid credentials");
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken();
  const tokenHash = hashToken(refreshToken);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1,$2,$3)`,
    [user.id, tokenHash, expiresAt],
  );

  return { accessToken, refreshToken, user };
};

export const refreshAccessToken = async (refreshToken) => {
  const tokenHash = hashToken(refreshToken);

  const result = await pool.query(
    `SELECT * FROM refresh_tokens WHERE token_hash=$1`,
    [tokenHash],
  );

  const storedToken = result.rows[0];

  if (!storedToken) {
    throw new Error("Invalid refresh token");
  }

  if (new Date(storedToken.expires_at) < new Date()) {
    throw new Error("Refresh token expired");
  }

  const userResult = await pool.query(
    `SELECT id, role FROM users WHERE id=$1`,
    [storedToken.user_id],
  );

  const user = userResult.rows[0];

  const newAccessToken = generateAccessToken(user);

  return newAccessToken;
};

export const logoutUser = async (refreshToken) => {
  const tokenHash = hashToken(refreshToken);

  await pool.query(`DELETE FROM refresh_tokens WHERE token_hash=$1`, [
    tokenHash,
  ]);
};

export const getUsers = async () => {
  const result = await pool.query(
    `SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC`,
  );

  return result.rows;
};
