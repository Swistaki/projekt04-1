import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SALT_ROUNDS = 10;

const DATA_FILE = path.join(__dirname, "..", "data", "users.json");

function ensureDataDir() {
  const dataDir = path.join(__dirname, "..", "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function loadUsers() {
  ensureDataDir();
  if (!fs.existsSync(DATA_FILE)) {
    return [];
  }
  try {
    const data = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveUsers(users) {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
}

const users = loadUsers();

function getNextId() {
  if (users.length === 0) return 1;
  return Math.max(...users.map((u) => u.id)) + 1;
}

function getAll() {
  return users;
}

function getByUsername(username) {
  return users.find((u) => u.username === username);
}

function getById(id) {
  return users.find((u) => u.id === id);
}

function markSeenSampleMovies(userId) {
  const user = users.find((u) => u.id === userId);
  if (user) {
    user.hasSeenSampleMovies = true;
    saveUsers(users);
  }
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

  const newUser = {
    id: getNextId(),
    username,
    password: hashedPassword,
    createdAt: new Date().toISOString(),
    hasSeenSampleMovies: false,
  };

  users.push(newUser);
  saveUsers(users);
  return { user: newUser };
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
