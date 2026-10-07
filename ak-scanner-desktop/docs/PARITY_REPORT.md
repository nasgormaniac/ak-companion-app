# Feature parity report — Phase 07

This report was created before Phase 07 code changes. The comparison uses read-only `../ak-scanner`, the Phase 00/01 inventory and migration plan, and the desktop source after Phase 06. `../../answers.txt` contains `[NO CHANGES]`; established user decisions still apply. “Parity” means preserving the useful workflow, not importing legacy rows or rebuilding Laravel infrastructure.

## Initial audit

| Area / legacy feature | Initial classification | Evidence, gap, and decision |
|---|---|---|
| Startup: browser route and Laravel boot | INTENTIONALLY_IMPROVED | Electron opens local Vite output; main initializes SQLite before the window. XAMPP/PHP and an inbound web server are unnecessary. Desktop startup needs a non-GUI smoke check; native GUI launch is environment dependent. |
| Home manual Scan | INTENTIONALLY_IMPROVED | Split Home layout and raw POST retained; desktop accepts punctuation used by legacy cards and checks 2xx. |
| Animal, Strong, Miracle navigation and pages | IMPLEMENTED | Home opens each catalogue; each has Home, Add, Edit, Delete, Use; forms use category fields and legacy colors. |
| Add/edit forms and defaults | IMPLEMENTED | Name, rarity, code, image, and category-specific options are present; Strong levels appear side by side. Edit retains current image when no replacement is chosen. |
| CRUD and global card-code uniqueness | INTENTIONALLY_IMPROVED | Main repository and SQLite create/update/delete rows. A global unique code constraint replaces three independent legacy tables. CRUD feedback exists. |
| First-launch empty catalogue and manual card/image entry | IMPLEMENTED | New database has zero cards; each catalogue has an empty state and Add action. Image picker and IPC write an owned file before the card row. No legacy importer. |
| Image replacement and deletion | PARTIAL | New image is written before DB update and old one is removed after commit. Delete reports cleanup failure. Replacement currently suppresses old-image cleanup failure; invalid/failed staged-image cleanup can also leave an orphan silently. Needs visible warning and recoverable cleanup. |
| Catalogue card image/display | IMPLEMENTED | Image-first cards use IPC reads from userData with a visible unavailable placeholder; no Laravel public-storage symlink. |
| Catalogue search, six-card pagination, newest-first order | IMPLEMENTED | Repository performs parameterized name search, six items per page, stable newest-first order; renderer has search and page controls. |
| Requested category filters and rarity sorting | INTENTIONALLY_IMPROVED | Animal rarity/gold attack/type; Strong rarity/Guts/Tech/Power/aura; Miracle rarity/effect/type. All categories offer rarity ascending/descending. |
| Stored-card Use flow | INTENTIONALLY_IMPROVED | Sends by stored ID without revalidation; Animal → Strong → Miracle → Home advances only on accepted HTTP response. Failure stays inline. Actual in-game scan after HTTP acceptance remains unverified. |
| Local game protocol | IMPLEMENTED | Main sends raw code as `text/plain` POST to fixed `127.0.0.1:<port>/sys147/barcode` with deadline, response bound, and no retry. No emulator internals required. |
| Game port configuration | PARTIAL | Home saves a valid port and next send uses it. `readGameSettings` returns a warning for corrupt/unreadable settings, but `main.cjs` discards that warning, so fallback to 9876 is silent. |
| SQLite schema, tables, and lifecycle | INTENTIONALLY_IMPROVED | One `cards` table with CHECK/UNIQUE/indexes, `user_version` migrations, integrity check, and upgrade backup. Laravel framework tables and old data are absent by choice. |
| Validation and known-cause errors | PARTIAL | Renderer/main/IPC/SQLite layers and English errors exist. Failed edit-card load sets feedback and immediately calls a navigation helper that clears it. Catalogue load failure may leave old cards visible. These UI error paths need correction. |
| Delete confirmation and feedback dialogs | INTENTIONALLY_IMPROVED | Named custom confirmation replaces native browser confirm; CRUD outcomes use visible status banners. Game sends use inline status, as requested. |
| Light/dark preference | PARTIAL | CSS palettes and localStorage toggle exist. An invalid stored theme value is not normalized, so toggle label and appearance can disagree. |
| Application icon | PARTIAL | User's wide logo is shown in the UI and copied into Vite output. Native BrowserWindow icon and final square `.ico`/installer identity are not wired yet. The square Windows packaging treatment belongs to Phase 09. |
| English default UI, local typography, restrained hints | IMPLEMENTED | React labels, validation, statuses, and main-process messages are English; Segoe UI replaces remote legacy fonts. |
| Browser CSRF/session/route binding | INTENTIONALLY_IMPROVED | Electron uses isolated preload and authorized IPC; main checks IDs/payloads. No inbound browser mutation endpoints or Laravel sessions. |
| Browser `/up` health route | INTENTIONALLY_REMOVED | No inbound desktop server; local send status is shown after a real send. |
| Legacy users/auth, password reset, queue/cache/mail/broadcast, Axios bootstrap, sample card/images | INTENTIONALLY_REMOVED | No active product workflow or user authorization for these features; not migrated. |
| Legacy SQLite/image import | INTENTIONALLY_REMOVED | User will enter new cards/images manually. Legacy database stays read-only. |
| Settings/user preferences | INTENTIONALLY_IMPROVED | Theme is persisted locally; port is saved in userData. Corrupt setting warning gap listed above. |
| Edge cases and error handling | PARTIAL | Duplicate code, bad image, connection failure, and database startup failure are specific. Image cleanup, edit-load feedback, stale catalogue results, and settings fallback need work. |
| Shutdown | IMPLEMENTED | `before-quit` aborts game requests, unregisters IPC, and closes SQLite; window close also disposes game service. |
| Play! service identity, response semantics, in-game completion | UNCLEAR | A prior live HTTP check returned 200 before the user started the game. HTTP acceptance is not evidence of completed in-game scan. No emulator reverse engineering is required. |

## Phase 07 work plan and gates

1. **Done:** File cleanup now reports replacement and failed-operation orphan warnings. On startup, the app retries removal of generated image files with no card reference once they are at least one minute old, avoiding a race with a fresh write in another process. It shows a warning if cleanup fails. The lifecycle test covers warning, grace period, and retry paths. Gate: 21 tests passed, Vite build passed, Electron-as-Node SQLite startup reached schema version 2.
2. **Done:** Failed Edit loads now keep their error banner when returning to the catalogue. Catalogue load failure clears stale cards and offers Retry. Missing edit images show a warning. Saved theme values outside `light`/`dark` fall back to the system preference. Gate: 21 tests passed, Vite build passed, Electron-as-Node SQLite startup reached schema version 2.
3. **Done:** Corrupt/unreadable game-port settings now show an English startup warning before using 9876. BrowserWindow now uses the supplied `app-icon.png` from built assets or the source public directory. Gate: 21 tests passed, Vite build passed, icon assets were present, main entry syntax passed, and Electron-as-Node SQLite startup reached schema version 2.
4. **Done:** IPC tests now create and read images for Animal, Strong, and Miracle, exercise category filters, and reject a code reused across categories. Final gate: 21 tests and Vite build passed; the safe Electron runtime startup gate passed in the preceding group.

## Final status after Phase 07

| Initial gap | Final classification | Resolution |
|---|---|---|
| Image replacement/failed-stage cleanup | INTENTIONALLY_IMPROVED | Warnings now reach the UI. Unreferenced generated image files older than one minute are retried at a later startup; unresolved cleanup is shown as a startup warning. Successful row writes remain committed even if old-file removal fails. |
| Settings fallback | IMPLEMENTED | Invalid or unreadable port settings visibly fall back to 9876. Valid saved ports still control the next game send. |
| Edit-card/catalogue error paths | IMPLEMENTED | Edit load errors remain visible after navigation; missing image on edit warns; failed catalogue loads clear stale results and offer Retry. |
| Theme preference | IMPLEMENTED | Only saved `light` or `dark` values are accepted; malformed stored values fall back to initial system preference. |
| Application icon | IMPLEMENTED | Supplied logo appears in UI and is assigned to BrowserWindow. A square Windows `.ico` and installer branding remain scheduled for Phase 09 packaging, which is outside this feature-parity implementation. |

No unexplained **MISSING** or **PARTIAL** product features remain from the audited legacy workflow and requested desktop additions. The native Electron window could not be launched reliably from Codex's sandbox, so the safe startup gate used Electron in Node mode to initialize the real SQLite schema, along with source syntax, Vite build, and IPC/service tests. A user's `npm start` review is still needed to inspect the new title-bar icon and end-to-end Play! behavior. HTTP 2xx acceptance remains distinct from confirmed in-game scan completion.
