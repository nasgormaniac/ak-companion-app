# Desktop database initialization and migration (Phase 04)

The desktop database is independent of `../ak-scanner/database/database.sqlite`. The legacy database and image directory are never opened by the desktop runtime. Users add cards and images manually to a fresh database. `PRAGMA user_version` is the only schema-version marker; no Laravel migration table or import metadata is created.

## Startup cases

1. **No database:** create `userData/data/ak-scanner.sqlite`, apply migrations 1 and 2 in one transaction, create `userData/images/`, and start with zero cards.
2. **Current version 2:** run an integrity check, enable foreign keys, and open normally without creating an upgrade backup.
3. **Older desktop version 1:** check integrity, create a verified backup of the database and images under `userData/backups/`, then apply pending migrations in order and verify the final schema version, integrity, and card count.
4. **Unknown existing version 0 with tables, or version newer than the app:** stop startup with a specific error; do not overwrite the file or guess its provenance.
5. **Migration failure:** the migration transaction rolls back DDL and `user_version` together. The pre-upgrade backup remains available; startup stops with a visible database error.

Migration 1 creates the unified `cards` table and newest-first index. Migration 2 adds the category/rarity index. Keeping both ordered steps makes upgrade behavior testable with real version-1 desktop data. Future migrations append new numbered steps; old migration SQL is not edited after release.

## Type, constraint, and data decisions

The legacy card IDs and timestamps are not transferred. New IDs use SQLite integer row IDs. Names remain text; category fields are constrained to the legacy option sets. Strong levels become integers 1–5. Miracle effect remains text with its exact options. `card_code` uses eight printable ASCII bytes starting with `bn` and is unique in the single table across categories. Image paths become owned relative filenames; the repository requires an image filename for creation, while the later image service is responsible for validating and staging the actual JPEG/PNG file. Timestamp columns are non-null UTC text. No card-status column or user-account relationship is needed.

The repository uses prepared statements for values, allowlisted SQL columns for filters, bounded pagination, and explicit transactions for create/update/delete. Known validation and duplicate-code failures are translated into stable safe error codes. Saved-card Use looks up the code by integer ID in main and does not revalidate a stored code each time.

## Backup and recovery

`backupDesktopData` creates a uniquely named backup directory under `userData/backups/`. It uses SQLite `VACUUM INTO` with a bound destination path to make a consistent database snapshot, copies the owned `images/` directory, runs `PRAGMA integrity_check` on the snapshot, writes a manifest, and renames the `.partial` directory only after completion. A failed backup removes the incomplete directory and blocks a schema upgrade. This uses SQLite's snapshot facility without relying on filesystem copying of a live WAL database.

For a future desktop schema upgrade, keep the pre-upgrade backup and run the migration in a transaction. On a failed migration, leave the source database and backup intact and stop startup. If post-upgrade verification fails after commit, stop startup and restore from the backup only after closing the app; replace the database and images together, and remove the failed database's `-wal` and `-shm` sidecar files before reopening. Do not restore from the legacy Laravel database. The backup helper is currently an internal main-process operation; backup/restore UI and image lifecycle controls are later-phase work.

## Verification

Automated tests cover an empty first launch, current-version reopen, card CRUD, global uniqueness across categories, category and barcode CHECK constraints, foreign-key enforcement being enabled, multi-statement transaction rollback, version-1-to-2 migration preserving a card and image, a verified pre-upgrade backup, rollback after a broken migration, and refusal of unknown/newer schemas. Before and after each upgrade, startup runs `PRAGMA integrity_check`; if `cards` already exists, it also compares the row count. A later release that intentionally changes row count needs an explicit migration-specific verification rule. The manually entered desktop data should also be checked after an installed-app upgrade by opening catalogue pages and images and by making a new backup before further editing.

On 2026-10-06, the same database initialization, card insert/lookup, and backup path also passed under Electron 44.5.1's embedded Node 24.21.0 runtime. The user then launched `npm start` from a normal interactive Windows CMD and supplied a screenshot showing the desktop window and Phase 03 preview UI. Main opens the database before creating that window, so this confirms startup passed the database-opening step. The Codex sandbox still cannot read the user's real `userData` database for a separate integrity query; its automated database checks use isolated temporary directories. The temporary development ACL change made during GUI troubleshooting was removed by the user.
