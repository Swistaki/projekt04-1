import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db_path = path.join(__dirname, "..", "data", "app.db");
const db = new Database(db_path);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    hasSeenSampleMovies INTEGER DEFAULT 0,
    isAdmin INTEGER DEFAULT 0
  ) STRICT;

  CREATE TABLE IF NOT EXISTS movies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    director TEXT NOT NULL,
    year INTEGER,
    genre TEXT,
    rating REAL,
    userId INTEGER,
    hiddenFor TEXT,
    FOREIGN KEY (userId) REFERENCES users(id)
  ) STRICT;
`);

const db_ops = {
  insert_movie: db.prepare(`
    INSERT INTO movies (title, director, year, genre, rating, userId, hiddenFor)
    VALUES (?, ?, ?, ?, ?, ?, NULL)
  `),
  get_all_movies: db.prepare(`SELECT * FROM movies`),
  get_movies_for_user: db.prepare(`
    SELECT * FROM movies WHERE userId IS NULL OR userId = ?
  `),
  get_movie_by_id: db.prepare(`SELECT * FROM movies WHERE id = ?`),
  update_movie: db.prepare(`
    UPDATE movies SET title = ?, director = ?, year = ?, genre = ?, rating = ?, userId = ?
    WHERE id = ?
    RETURNING id, title, director, year, genre, rating, userId, hiddenFor
  `),
  update_movie_hidden: db.prepare(`
    UPDATE movies SET hiddenFor = ? WHERE id = ?
    RETURNING id
  `),
  delete_movie: db.prepare(`DELETE FROM movies WHERE id = ?`),

  insert_user: db.prepare(`
    INSERT INTO users (username, password, createdAt, hasSeenSampleMovies, isAdmin)
    VALUES (?, ?, ?, 0, 0)
    RETURNING id, username, createdAt, hasSeenSampleMovies, isAdmin
  `),
  get_all_users: db.prepare(`SELECT * FROM users`),
  get_user_by_username: db.prepare(`SELECT * FROM users WHERE username = ?`),
  get_user_by_id: db.prepare(`SELECT * FROM users WHERE id = ?`),
  get_user_by_id_with_password: db.prepare(`SELECT * FROM users WHERE id = ?`),
  update_user_seen_samples: db.prepare(`UPDATE users SET hasSeenSampleMovies = 1 WHERE id = ?`),
  update_user: db.prepare(`
    UPDATE users SET username = ?, password = ? WHERE id = ?
    RETURNING id, username, createdAt, hasSeenSampleMovies, isAdmin
  `),
  update_user_no_password: db.prepare(`
    UPDATE users SET username = ? WHERE id = ?
    RETURNING id, username, createdAt, hasSeenSampleMovies, isAdmin
  `),
  get_movies_count_for_user: db.prepare(`
    SELECT COUNT(*) as count FROM movies WHERE userId = ?
  `),
  get_last_insert_id: db.prepare(`SELECT last_insert_rowid() as id`),
};

export default db_ops;
export { db };
