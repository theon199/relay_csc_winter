import * as schema from "./schema";
import { drizzle as drizzleD1 } from "drizzle-orm/d1";
import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

let _localDb: ReturnType<typeof drizzleSqlite<typeof schema>> | null = null;

export function getDb(d1Binding?: any) {
  // 1. If running inside Cloudflare runtime with D1 binding
  if (d1Binding) {
    return drizzleD1(d1Binding, { schema });
  }

  // 2. Check global or process Cloudflare context
  if (typeof globalThis !== "undefined" && (globalThis as any).process?.env?.DB) {
    return drizzleD1((globalThis as any).process.env.DB, { schema });
  }

  // 3. Fallback to local SQLite for local dev server and testing
  if (!_localDb) {
    const dataDir = path.join(process.cwd(), ".data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const sqlitePath = path.join(dataDir, "relay-dev.db");
    const sqlite = new Database(sqlitePath);
    sqlite.pragma("journal_mode = WAL");
    _localDb = drizzleSqlite(sqlite, { schema });

    // Initialize tables if they don't exist
    initLocalTables(sqlite);
  }

  return _localDb;
}

export function initLocalTables(sqlite: Database.Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      display_name TEXT NOT NULL,
      role TEXT NOT NULL,
      avatar_seed TEXT NOT NULL,
      email TEXT NOT NULL,
      safe_neighborhood TEXT,
      skills TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS organizations (
      id TEXT PRIMARY KEY,
      owner_user_id TEXT NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      description TEXT,
      is_approved INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS hubs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      category TEXT NOT NULL,
      is_approved INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS shifts (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL REFERENCES organizations(id),
      hub_id TEXT REFERENCES hubs(id),
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      location_type TEXT NOT NULL,
      start_at TEXT,
      end_at TEXT,
      duration_mins INTEGER NOT NULL DEFAULT 60,
      capacity INTEGER NOT NULL DEFAULT 2,
      status TEXT NOT NULL DEFAULT 'published',
      required_skills TEXT,
      intake_request_id TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS shift_claims (
      id TEXT PRIMARY KEY,
      shift_id TEXT NOT NULL REFERENCES shifts(id),
      user_id TEXT NOT NULL REFERENCES users(id),
      status TEXT NOT NULL DEFAULT 'confirmed',
      invitation_id TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS invitations (
      id TEXT PRIMARY KEY,
      token TEXT NOT NULL UNIQUE,
      shift_id TEXT NOT NULL REFERENCES shifts(id),
      inviter_user_id TEXT NOT NULL REFERENCES users(id),
      claimed_by_user_id TEXT REFERENCES users(id),
      status TEXT NOT NULL DEFAULT 'active',
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS intake_requests (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      raw_text TEXT NOT NULL,
      parsed_json TEXT,
      status TEXT NOT NULL DEFAULT 'reviewed',
      created_at TEXT NOT NULL
    );
  `);
}

export { schema };
