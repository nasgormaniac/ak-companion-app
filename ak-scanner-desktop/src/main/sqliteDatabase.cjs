'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const { SCHEMA_VERSION, MIGRATIONS } = require('./sqliteSchema.cjs');
const { backupDesktopData } = require('./sqliteBackup.cjs');

class DatabaseError extends Error {
  constructor(code, message, cause) {
    super(message, { cause });
    this.name = 'DatabaseError';
    this.code = code;
  }
}

function databasePath(userDataPath) {
  return path.join(userDataPath, 'data', 'ak-scanner.sqlite');
}

function getVersion(db) {
  return db.prepare('PRAGMA user_version').get().user_version;
}

function assertIntegrity(db) {
  if (db.prepare('PRAGMA integrity_check').get().integrity_check !== 'ok') {
    throw new DatabaseError('DATABASE_CORRUPT', 'The card database failed its integrity check.');
  }
}

function cardCountIfPresent(db) {
  const hasCards = db.prepare("SELECT 1 AS present FROM sqlite_master WHERE type='table' AND name='cards'").get();
  return hasCards ? db.prepare('SELECT count(*) AS total FROM cards').get().total : null;
}

function applyMigrations(db, fromVersion, migrations = MIGRATIONS) {
  const pending = migrations.filter((migration) => migration.version > fromVersion);
  let expected = fromVersion + 1;
  for (const migration of pending) {
    if (migration.version !== expected) throw new DatabaseError('MIGRATION_SEQUENCE', 'The database migration sequence is incomplete.');
    expected += 1;
  }
  if (pending.length === 0) return;
  db.exec('BEGIN IMMEDIATE');
  try {
    for (const migration of pending) {
      db.exec(migration.sql);
      db.exec(`PRAGMA user_version = ${migration.version}`);
    }
    db.exec('COMMIT');
  } catch (error) {
    try { db.exec('ROLLBACK'); } catch { /* original failure is more useful */ }
    throw new DatabaseError('MIGRATION_FAILED', 'Database upgrade failed; the existing data was preserved.', error);
  }
}

function openDesktopDatabase(userDataPath) {
  const filePath = databasePath(userDataPath);
  const existed = fs.existsSync(filePath);
  let db;
  let preUpgradeBackup = null;
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    db = new DatabaseSync(filePath);
    db.exec('PRAGMA busy_timeout = 5000');
    db.exec('PRAGMA foreign_keys = ON');
    assertIntegrity(db);
    const version = getVersion(db);
    if (version > SCHEMA_VERSION) {
      throw new DatabaseError('UNSUPPORTED_SCHEMA_VERSION', 'This database was created by a newer version of the app.');
    }
    if (version === 0 && existed) {
      const table = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' LIMIT 1").get();
      if (table) throw new DatabaseError('UNRECOGNIZED_DATABASE', 'The existing database schema is not recognized. The file was not changed.');
    }
    if (version < SCHEMA_VERSION) {
      const previousCardCount = cardCountIfPresent(db);
      if (existed) preUpgradeBackup = backupDesktopData(db, userDataPath, 'pre-upgrade');
      applyMigrations(db, version);
      assertIntegrity(db);
      if (getVersion(db) !== SCHEMA_VERSION) {
        throw new DatabaseError('MIGRATION_VERIFICATION_FAILED', 'Database schema version is incorrect after migration.');
      }
      if (previousCardCount !== null && cardCountIfPresent(db) !== previousCardCount) {
        throw new DatabaseError('MIGRATION_VERIFICATION_FAILED', 'The card count changed after migration. Check the backup before continuing.');
      }
    }
    db.exec('PRAGMA journal_mode = WAL');
    fs.mkdirSync(path.join(userDataPath, 'images'), { recursive: true });
    return {
      db,
      path: filePath,
      preUpgradeBackup,
      close: () => db.close(),
      backup: () => backupDesktopData(db, userDataPath, 'manual'),
    };
  } catch (error) {
    try { db?.close(); } catch { /* preserve the original failure */ }
    if (!existed && db) {
      try { fs.rmSync(filePath, { force: true }); } catch { /* retain original error */ }
    }
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError('DATABASE_OPEN_FAILED', 'Could not open or write the local database.', error);
  }
}

module.exports = { DatabaseError, databasePath, getVersion, assertIntegrity, applyMigrations, openDesktopDatabase };
