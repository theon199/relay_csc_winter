/**
 * Local development database: better-sqlite3 file at .data/relay-dev.db.
 * Never imported in production (see src/lib/data-client.ts), so it stays out of serverless bundles.
 */
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import fs from "fs";
import path from "path";
import * as schema from "./schema";
import { resetDemo } from "../services/relay";

let db: ReturnType<typeof drizzle<typeof schema>> | null = null;
let ready: Promise<void> | null = null;

/** Applies drizzle/*.sql migrations once, the same files deployed to Cloudflare D1. */
function migrate(sqlite: Database.Database) {
  sqlite.exec("CREATE TABLE IF NOT EXISTS _relay_migrations (name TEXT PRIMARY KEY)");
  const dir = path.join(process.cwd(), "drizzle");
  const files = fs.readdirSync(dir).filter((f) => /^\d+_.*\.sql$/.test(f)).sort();
  for (const file of files) {
    const done = sqlite.prepare("SELECT 1 FROM _relay_migrations WHERE name = ?").get(file);
    if (done) continue;
    const statements = fs
      .readFileSync(path.join(dir, file), "utf8")
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter(Boolean);
    sqlite.transaction(() => {
      for (const stmt of statements) sqlite.exec(stmt);
      sqlite.prepare("INSERT INTO _relay_migrations (name) VALUES (?)").run(file);
    })();
  }
}

export async function getLocalDb() {
  if (!db) {
    const dataDir = path.join(process.cwd(), ".data");
    fs.mkdirSync(dataDir, { recursive: true });
    const sqlite = new Database(path.join(dataDir, "relay-dev.db"));
    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("foreign_keys = ON");
    migrate(sqlite);
    db = drizzle(sqlite, { schema });
    const empty = !sqlite.prepare("SELECT 1 FROM users LIMIT 1").get();
    ready = empty ? resetDemo(db).then(() => undefined) : Promise.resolve();
  }
  await ready;
  return db;
}
