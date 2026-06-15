import { mkdirSync } from "node:fs"
import path from "node:path"

import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"

import * as schema from "@/db/schema"

export const sqlitePath = path.join(process.cwd(), "var", "pizza-panic.sqlite")

let sqlite: Database.Database | undefined
let db: ReturnType<typeof drizzle<typeof schema>> | undefined

export function getSqlite() {
  if (!sqlite) {
    mkdirSync(path.dirname(sqlitePath), { recursive: true })
    sqlite = new Database(sqlitePath)
    sqlite.pragma("foreign_keys = ON")
    sqlite.pragma("journal_mode = WAL")
  }

  return sqlite
}

export function getDb() {
  db ??= drizzle(getSqlite(), { schema })
  return db
}

export function closeDb() {
  sqlite?.close()
  sqlite = undefined
  db = undefined
}
