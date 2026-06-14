import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '../../datasets.db');

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS datasets (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    format      TEXT NOT NULL,
    row_count   INTEGER NOT NULL,
    col_count   INTEGER NOT NULL,
    uploaded_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS dataset_columns (
    dataset_id  TEXT NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
    col_name    TEXT NOT NULL,
    col_type    TEXT NOT NULL,
    PRIMARY KEY (dataset_id, col_name)
  );

  CREATE TABLE IF NOT EXISTS dataset_rows (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    dataset_id  TEXT NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
    row_data    TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS revoked_tokens (
    jti         TEXT PRIMARY KEY,
    revoked_at  INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS analytics_cache (
    key         TEXT PRIMARY KEY,
    value       TEXT NOT NULL,
    computed_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    email      TEXT UNIQUE NOT NULL,
    created_at INTEGER NOT NULL,
    last_login INTEGER NOT NULL,
    is_active  INTEGER NOT NULL DEFAULT 1
  );
`);

export default db;
