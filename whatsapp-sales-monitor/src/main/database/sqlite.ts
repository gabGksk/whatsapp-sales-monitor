import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { env } from "../config/env";

export const createSqliteConnection = (): Database.Database => {
  mkdirSync(dirname(env.DB_PATH), { recursive: true });
  const db = new Database(env.DB_PATH, { fileMustExist: false, timeout: 5000 });
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  return db;
};
