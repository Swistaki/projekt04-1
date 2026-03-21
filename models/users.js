import bcrypt from "bcryptjs";
import db_ops from "./database.js";

const SALT_ROUNDS = 10;

function parseUser(row) {
  return {
    ...row,
    hasSeenSampleMovies: Boolean(row.hasSeenSampleMovies),
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

export default {
  getAll,
  getByUsername,
  getById,
  create,
  validatePassword,
  markSeenSampleMovies,
};
