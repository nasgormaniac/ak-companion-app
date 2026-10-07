# Database analysis (Phase 00)

## Provenance

The user confirmed that the legacy database is SQLite, matching `.env`. I opened `../ak-scanner/database/database.sqlite` with PHP's SQLite3 extension and `SQLITE3_OPEN_READONLY`; the inspection used `sqlite_master`, `PRAGMA table_info/index_list/foreign_key_list`, aggregate `SELECT`s, and `PRAGMA integrity_check`. No records or schema were changed. This checked-in file is the active schema according to the user. Its integrity check returned `ok`. The migration files remain useful for Laravel-level intent, while the actual SQLite types and counts are documented below.

Laravel migration shorthand: `id()` requests an auto-increment primary key; SQLite uses `INTEGER`. `string()` and bare `char()` appear as `varchar` in the active database; `timestamps()` appear as nullable `datetime`. Columns are NOT NULL unless marked nullable. No card-table foreign keys, unique constraints, defaults, enum SQL types, or extra indexes exist in the active file.

## Application tables

| Table | Columns and migration types | Keys, constraints and values |
|---|---|---|
| `animals` | `id` id; `nama` string; `rarity` string; `gold_attack` char; `type` string; `card_code` string; `image` nullable string; nullable timestamps | PK `id`. Controller permits rarity `common,bronze,silver,gold,ultra,kaiser`; gold attack `G,T,P`; type `speed,multi,heavy`. No unique barcode/index. |
| `strongs` | `id` id; `nama` string; `rarity` string; `guts_level`, `tech_level`, `power_level` char; `aura` string; `card_code` string; `image` nullable string; nullable timestamps | PK `id`. Controller permits rarity `common,bronze,silver,gold`; each level `1`–`5`; aura `none,shining,defense,burning,evil,forest,miracle`. No unique barcode/index. |
| `miracles` | `id` id; `nama` string; `rarity` string; `effect` string; `type` string; `card_code` string; `image` nullable string; nullable timestamps | PK `id`. Rarity `common,bronze,silver,gold`; type `speed,multi,heavy`; effect values listed in `VALIDATION_BASELINE.md`. No unique barcode/index. |

## Laravel infrastructure tables

| Table | Columns and migration types | Keys/indexes/defaults |
|---|---|---|
| `users` | `id` id; `name`, `email`, `password` string; `email_verified_at` nullable timestamp; `remember_token` nullable string(100); nullable timestamps | PK `id`; unique `email`. No application login routes found. |
| `password_reset_tokens` | `email` string; `token` string; nullable `created_at` timestamp | PK `email`. |
| `sessions` | `id` string; nullable `user_id` foreignId; nullable `ip_address` string(45); nullable `user_agent` text; `payload` longText; `last_activity` integer | PK `id`; indexes on `user_id`, `last_activity`; no declared FK. |
| `cache` | `key` string; `value` mediumText; `expiration` integer | PK `key`. |
| `cache_locks` | `key`, `owner` string; `expiration` integer | PK `key`. |
| `jobs` | `id` id; `queue` string; `payload` longText; `attempts` unsignedTinyInteger; nullable `reserved_at` unsignedInteger; `available_at`, `created_at` unsignedInteger | PK `id`; index `queue`. |
| `job_batches` | `id`, `name` string; `total_jobs`, `pending_jobs`, `failed_jobs` integer; `failed_job_ids` longText; nullable `options` mediumText; nullable `cancelled_at`, `finished_at` integer; `created_at` integer | PK `id`. |
| `failed_jobs` | `id` id; `uuid` string; `connection`, `queue` text; `payload`, `exception` longText; `failed_at` timestamp | PK `id`; unique `uuid`; `failed_at` defaults to current timestamp. |

## Active SQLite file: physical schema and data

The following lists every table and observed physical column type. `!` means NOT NULL, `?` means nullable, `PK` means primary key. Unless stated, columns have no SQL default. All three card-table `id` columns are `INTEGER ! PK`; each has no secondary index or foreign key.

| Table | Physical columns beyond the `id` primary key (or all columns when there is no `id`) | Rows | Indexes/defaults |
|---|---|---:|---|
| `animals` | `nama varchar !`, `rarity varchar !`, `gold_attack varchar !`, `type varchar !`, `card_code varchar !`, `image varchar ?`, `created_at datetime ?`, `updated_at datetime ?` | 52 | No secondary indexes. |
| `strongs` | `nama varchar !`, `rarity varchar !`, `guts_level varchar !`, `tech_level varchar !`, `power_level varchar !`, `aura varchar !`, `card_code varchar !`, `image varchar ?`, `created_at datetime ?`, `updated_at datetime ?` | 20 | No secondary indexes. |
| `miracles` | `nama varchar !`, `rarity varchar !`, `effect varchar !`, `type varchar !`, `card_code varchar !`, `image varchar ?`, `created_at datetime ?`, `updated_at datetime ?` | 30 | No secondary indexes. |
| `users` | `id INTEGER ! PK`, `name varchar !`, `email varchar !`, `email_verified_at datetime ?`, `password varchar !`, `remember_token varchar ?`, `created_at datetime ?`, `updated_at datetime ?` | 0 | Unique `users_email_unique`. |
| `password_reset_tokens` | `email varchar ! PK`, `token varchar !`, `created_at datetime ?` | 0 | Primary-key autoindex. |
| `sessions` | `id varchar ! PK`, `user_id INTEGER ?`, `ip_address varchar ?`, `user_agent TEXT ?`, `payload TEXT !`, `last_activity INTEGER !` | 2 | Primary-key autoindex; indexes on `user_id` and `last_activity`. No FK. |
| `cache` | `key varchar ! PK`, `value TEXT !`, `expiration INTEGER !` | 0 | Primary-key autoindex. |
| `cache_locks` | `key varchar ! PK`, `owner varchar !`, `expiration INTEGER !` | 0 | Primary-key autoindex. |
| `jobs` | `id INTEGER ! PK`, `queue varchar !`, `payload TEXT !`, `attempts INTEGER !`, `reserved_at INTEGER ?`, `available_at INTEGER !`, `created_at INTEGER !` | 0 | Index on `queue`. |
| `job_batches` | `id varchar ! PK`, `name varchar !`, `total_jobs INTEGER !`, `pending_jobs INTEGER !`, `failed_jobs INTEGER !`, `failed_job_ids TEXT !`, `options TEXT ?`, `cancelled_at INTEGER ?`, `created_at INTEGER !`, `finished_at INTEGER ?` | 0 | Primary-key autoindex. |
| `failed_jobs` | `id INTEGER ! PK`, `uuid varchar !`, `connection TEXT !`, `queue TEXT !`, `payload TEXT !`, `exception TEXT !`, `failed_at datetime !` | 0 | Unique `failed_jobs_uuid_unique`; `failed_at` default `CURRENT_TIMESTAMP`. |
| `migrations` | `id INTEGER ! PK`, `migration varchar !`, `batch INTEGER !` | 6 | No secondary indexes. |

There are no views, triggers, or foreign keys in the active file. SQLite has no stored procedure objects. No card column is clearly unused; Strong level columns are collected but omitted from list cards. The user confirmed that Laravel framework tables such as `users`, `sessions`, cache, jobs, password reset, and migration bookkeeping should not be recreated in the desktop database unless a concrete desktop feature requires them. The target needs its own schema-version tracking, which does not require copying Laravel's `migrations` table.

Across the three card tables, all 102 card codes are unique, eight bytes long, begin with lowercase `bn`, and contain printable ASCII without whitespace. **88 contain punctuation after the prefix**, so an alphanumeric-only rule would reject existing records. No card image path is null/empty or points to a missing file in this checkout. There are 103 files in `storage/app/public/card_img` totaling about 3.49 MB, one more than the number of card records; do not assume every file is referenced. These findings establish compatibility requirements, not the exact protocol accepted by the game.

## Decision for the desktop database

The user will enter cards and choose images manually in the new app. The existing 52 Animal, 20 Strong, and 30 Miracle rows are audit evidence only; there is no planned copy, import wizard, legacy ID mapping, or record-count parity requirement. The desktop database starts empty. Do not modify the legacy database or image directory.

Use the active schema to preserve field meaning and valid options. The 102 inspected card codes are all eight characters, start with `bn`, and are unique across categories; 88 contain punctuation. The new app needs a compatible input rule and global uniqueness for cards that the user enters. A unified `cards` table can enforce this with one unique constraint. Do not recreate Laravel framework tables when no desktop feature needs them.

Keep **desktop schema migrations** for upgrades to the new app and backup/restore protection for data entered there. These are independent of legacy-data transfer. The source file's 103 image files are not copied automatically; the user selects images when adding cards. See `MANUAL_DATA_ENTRY_PLAN.md`.
