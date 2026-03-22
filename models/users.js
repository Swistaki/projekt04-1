import bcrypt from "bcryptjs";
import db_ops, { db } from "./database.js";

const SALT_ROUNDS = 10;

function parseUser(row) {
  return {
    ...row,
    hasSeenSampleMovies: Boolean(row.hasSeenSampleMovies),
    isAdmin: Boolean(row.isAdmin),
  };
}

function getAll() {
  return db_ops.get_all_users.all().map(parseUser);
}

function getByUsername(username) {
  const row = db_ops.get_user_by_username.get(username);
  return row ? parseUser(row) : null;
}

function getById(id) {
  const row = db_ops.get_user_by_id.get(id);
  return row ? parseUser(row) : null;
}

function markSeenSampleMovies(userId) {
  db_ops.update_user_seen_samples.run(userId);
}

async function create(userData) {
  const username = userData.username?.trim();
  const password = userData.password;

  if (!username || !password) {
    return { error: "Username and password are required" };
  }

  if (username.length < 3) {
    return { error: "Username must be at least 3 characters" };
  }

  if (password.length < 4) {
    return { error: "Password must be at least 4 characters" };
  }

  if (getByUsername(username)) {
    return { error: "Username already exists" };
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const result = db_ops.insert_user.run(username, hashedPassword, new Date().toISOString());
  return { user: parseUser(result) };
}

async function validatePassword(username, password) {
  const user = getByUsername(username);
  if (!user) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.password);
  return isValid ? user : null;
}

async function updateUser(id, userData) {
  const username = userData.username?.trim();
  const password = userData.password;
  const currentUser = db_ops.get_user_by_id_with_password.get(id);

  if (!currentUser) {
    return { error: "User not found" };
  }

  if (!username) {
    return { error: "Username is required" };
  }

  if (username.length < 3) {
    return { error: "Username must be at least 3 characters" };
  }

  const existingUser = getByUsername(username);
  if (existingUser && existingUser.id !== id) {
    return { error: "Username already exists" };
  }

  if (password && password.length < 4) {
    return { error: "Password must be at least 4 characters" };
  }

  let result;
  if (password) {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    result = db_ops.update_user.run(username, hashedPassword, id);
  } else {
    result = db_ops.update_user_no_password.run(username, id);
  }

  return { user: parseUser(result) };
}

function getUserMovieCount(userId) {
  const result = db_ops.get_movies_count_for_user.get(userId);
  return result.count;
}

async function createAdminUser() {
  const existingAdmin = getByUsername("admin");
  if (existingAdmin) {
    return { user: existingAdmin };
  }

  const hashedPassword = await bcrypt.hash("admin", SALT_ROUNDS);
  const stmt = db.prepare(`
    INSERT INTO users (username, password, createdAt, hasSeenSampleMovies, isAdmin)
    VALUES (?, ?, ?, 1, 1)
    RETURNING id, username, createdAt, hasSeenSampleMovies, isAdmin
  `);
  const result = stmt.get("admin", hashedPassword, new Date().toISOString());
  return { user: parseUser(result) };
}

export default {
  getAll,
  getByUsername,
  getById,
  create,
  validatePassword,
  markSeenSampleMovies,
  updateUser,
  getUserMovieCount,
  createAdminUser,
};
