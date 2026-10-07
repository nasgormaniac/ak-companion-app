# Legacy feature migration plan — Phase 01

The legacy source is read-only. This plan maps observed features and user-requested additions to the desktop design. `../../answers.txt` and subsequent user clarifications override older prompt assumptions. The user will enter cards manually in the desktop app; **feature migration** here means rebuilding workflows, not transferring old records. The words below describe intended behavior, not implemented status.

| Legacy feature or concern | Decision | Desktop treatment and reason |
|---|---|---|
| Home manual barcode entry and Scan | PRESERVE | Keep the split home layout and raw code send. Apply one consistent eight-character `bn` rule compatible with existing punctuation. |
| Animal, Strong, Miracle catalogues | PRESERVE | Keep three recognizable sections, fields, category colors, card imagery, and Home navigation. |
| Animal → Strong → Miracle → Home Use flow | MODERNIZE | Keep sequence and HTTP payload; advance only on accepted HTTP response. Saved Use reads code by card ID and does not revalidate it each click. |
| HTTP POST to local game/service | PRESERVE | Main process sends `text/plain` to loopback `127.0.0.1:9876/sys147/barcode`; no new emulator protocol. Add timeout and accurate status. |
| Laravel browser server and route forms | REPLACE | Use packaged React UI, preload, and validated IPC. Desktop does not need an inbound Laravel-style port. |
| Search by `nama` | PRESERVE | Keep case-insensitive name search behavior where practical; parameterize SQL and test against real names. |
| Six-card pagination and newest-first default | PRESERVE | Keep six per page and default created-time ordering, with stable ID tie-breaker. |
| Catalogue filters | MODERNIZE | Add Animal rarity/gold attack/type; Strong rarity/guts/tech/power levels/aura; Miracle rarity/effect/type. |
| Catalogue sorting | MODERNIZE | Add rarity ascending/descending for each category; no other new sort mode requested. |
| Card attributes and rarity badges | PRESERVE | Retain category-specific fields and colors. Strong levels may be shown in detail or filters while keeping familiar card hierarchy. |
| Add card and image | MODERNIZE | Keep workflow; validate fields/images in renderer and main, enforce global code uniqueness, stage image writes, show specific CRUD feedback. |
| Edit card and optional image replacement | MODERNIZE | Keep workflow; preserve existing image when omitted, fix malformed Gold select, update atomically enough to avoid silent partial failures. |
| Delete card and image | MODERNIZE | Keep explicit confirmation; delete DB row and owned image with recoverable cleanup and visible result. |
| Public Laravel image URL/symlink | REPLACE | Store images under Electron userData and serve them through a constrained app-owned mechanism; no public web storage link. |
| Laravel session flash messages | REPLACE | Use renderer UI state for CRUD feedback and inline/status game-send outcomes. No sessions table. |
| Browser CSRF tokens and route-model binding | REPLACE | No inbound browser server; validate IPC sender, arguments, record existence, and action permissions in main. |
| Laravel SQLite application card data | REMOVE_WITH_JUSTIFICATION | The user will manually enter cards and select images in a fresh desktop database. Old rows and IDs are not transferred. The new schema uses a unified `cards` table and global unique code. |
| Laravel framework tables: users, password reset, sessions, cache, jobs, failed jobs, migrations | REMOVE_WITH_JUSTIFICATION | No corresponding desktop feature needs their data; user explicitly said not to carry them. Desktop may use `PRAGMA user_version` for its own schema. |
| Laravel user factory, demo seeder, sample `card.blade.php`, unused static sample images, unused Axios bootstrap | REMOVE_WITH_JUSTIFICATION | No active product call sites; user explicitly excludes apparently unused features. |
| Laravel health route `/up` | REMOVE_WITH_JUSTIFICATION | An inbound health URL is unnecessary; desktop can report local service/database state in UI and tests. |
| XAMPP/PHP/Tailwind build runtime | REPLACE | Packaged Electron/React/Vite assets; development tooling is not installed by normal users. Visual colors and layout remain recognizable. |
| Browser native delete `confirm()` | MODERNIZE | Use accessible desktop dialog with explicit card identity and Cancel/Delete actions. |
| Validation/error handling | MODERNIZE | Detailed, consistent errors; valid legacy punctuation; no silent important failure or false game-send success. |
| Light/dark mode | MODERNIZE | New local preference and design tokens; keep category colors recognizable. |
| Application icon | MODERNIZE | User supplied `../../app-icon.png`, a wide transparent logo; derive a readable square Windows icon for final packaging. |
| Play! internals and exact game response semantics | UNCLEAR | No emulator reverse engineering needed; test observed HTTP endpoint during integration. Do not claim 2xx proves in-game completion. |
| Legacy data import/export wizard | REMOVE_WITH_JUSTIFICATION | The user chose manual entry; do not build an importer or require old database paths/counts during runtime. |
| Empty desktop database and manual first-card flow | MODERNIZE | On first launch, create empty SQLite and provide clear empty states and usable Add forms with image selection. |

## Work sequence and gates

1. **Architecture and skeleton:** establish Electron process boundaries, named IPC API, data paths, and packaged UI origin.
2. **Game integration:** use only observed loopback HTTP contract. Test connectivity, timeout, non-2xx, and the running Play! setup when available.
3. **SQLite persistence:** create a fresh unified target schema, global code uniqueness, schema migration runner, image storage, backup helper, and data service tests. The installed app begins with zero cards.
4. **UI and validation:** reproduce Home/catalogue/forms, then filters, rarity sorting, CRUD feedback, theme, and field-specific validation. Preserve the major visual identity.
5. **Parity, reliability, package:** compare every row above with the rebuilt app, verify packaged behavior, and integrate the user-supplied icon when it arrives.
6. **Manual entry readiness after installation:** verify the user can add one card per category with an image, restart, edit/delete safely, and see data persist. Document how to continue entering cards and back up the new database/images. Do not build or run a legacy data importer.

Evidence: `LEGACY_ANALYSIS.md`, `GAME_INTEGRATION.md`, `UI_BASELINE.md`, `DATABASE_ANALYSIS.md`, `VALIDATION_BASELINE.md`, `FEATURE_INVENTORY.md`, and user clarifications in `../../answers.txt` plus subsequent conversation.
