# Phase 08 test report — 7 October 2026

`../../answers.txt` currently says `[NO CHANGES]`. The earlier decisions still apply: English UI, SQLite, manual card and image entry, no legacy import. The requested Animal/Strong/Miracle filters, rarity sorting, global code uniqueness, CRUD feedback, specific errors, and visible game-send failures were checked against the implementation and tests.

## Results

- `npm test`: **28 passed, 0 failed** on Node 23.7.0. These are service, IPC, SQLite, theme, and CSP tests; they do not render an Electron window.
- `npm run build`: **passed** with Vite 8.3.2. Generated HTML uses relative asset paths, includes `app-icon.png`, and has the production CSP.
- `ELECTRON_RUN_AS_NODE=1 ...electron.exe`: **passed** with Electron 44.5.1 and a fresh SQLite schema version 2. This exercises Electron's bundled Node/SQLite without starting its GUI.
- A native Electron window, installed package, and actual in-game scan were **not run in this sandbox**. A previous user screenshot established that an earlier UI started, but it does not verify this build.

| # | Required scenario | Result and evidence |
|---|---|
| 1 | Clean first launch | **Automated core pass.** Fresh temp userData opens with zero cards and only the desktop `cards` table; Electron runtime smoke opened it. Native window pending. |
| 2 | Repeated launch | **Implementation reviewed.** A single-instance lock quits the second process and focuses the first. Native two-window observation pending. |
| 3 | Graceful shutdown | **Automated service pass / implementation reviewed.** Active send is aborted without retry; `before-quit` disposes service, unregisters IPC, closes SQLite. Native window close pending. |
| 4 | Missing SQLite DB | **Automated pass.** Temp userData has no DB before opening. |
| 5 | Automatic fresh DB creation | **Automated pass.** Schema version 2 and empty catalogue verified; interrupted version-zero initialization also passes. |
| 6 | Older DB schema migration | **Automated pass.** Version 1 backs up DB/images and migrates; failed migration rolls back. |
| 7 | Invalid configuration | **Automated pass.** Invalid saved/game port falls back or is rejected with an explicit result. |
| 8 | Game running | **Simulated service pass.** Loopback HTTP server receives exact POST body/path/content type and returns 204. Actual Play! scan pending. |
| 9 | Game not running | **Automated pass.** Closed local port returns `LOCAL_SERVICE_NOT_RUNNING`. |
| 10 | Wrong local port | **Automated pass.** Closed temporary port returns connection failure. |
| 11 | Connection timeout | **Automated pass.** Nonresponding server reaches deadline; concurrent send is rejected. |
| 12 | Malformed game response | **Automated pass.** Invalid HTTP bytes and oversized response return `INVALID_RESPONSE`. |
| 13 | SQLite read/write failure | **Automated pass.** Closed connection fails reads/writes; reopening retains existing card. |
| 14 | Invalid user input | **Automated pass.** Code, card fields, image data/size/structure, IDs, filters, and IPC arity rejected. |
| 15 | Duplicate data | **Automated pass.** Global code uniqueness across categories, duplicate update, unchanged existing row. |
| 16 | Light theme | **Automated preference pass.** Resolves/applies the light theme attribute; visual GUI pending. |
| 17 | Dark theme | **Automated preference pass.** Resolves/applies the dark theme attribute; visual GUI pending. |
| 18 | Persisted theme | **Automated pass.** Saved choice wins; bad storage values fall back safely. |
| 19 | Restart persistence | **Automated pass.** DB, three card categories and owned images survive close/reopen; port persistence test passes. |
| 20 | Window reload | **Implementation reviewed, GUI pending.** Renderer reload uses registered main-process IPC and persisted files; actual reload not observed in sandbox. |
| 21 | IPC validation | **Automated pass.** Sender frame/origin, IDs, payload fields, image filenames, and request arity checked. |
| 22 | Production build | **Passed.** `npm run build`; output HTML/CSS/JS and icon present. |
| 23 | Packaged-path behavior | **Static check only.** Main resolves `dist/index.html`, `dist/window-icon.png`, and preload relative to its own directory; assets exist in build. No packaged executable exists yet. |
| 24 | Database backup behavior | **Automated pass.** Manual and pre-upgrade backups include DB, image and manifest; backup DB can be read. |
| 25 | Application data persistence | **Automated pass.** Cards/images survive reopen; settings and theme have persistence tests. |
| 26 | Empty catalogue and manual Add with image for each category | **Automated IPC pass.** Starts with zero Animal/Strong/Miracle cards, adds one of each with a PNG, reads each image. GUI form pending. |
| 27 | Restart after manual entry | **Automated pass.** Reopens same userData and reads three card rows and image bytes. |

## Confirmed issues fixed

- A second application instance could open the same userData. Main now enforces one instance and focuses the first window.
- Production CSP allowed development WebSocket/connect destinations and inline styles, while image previews lacked a `blob:` allowance. The production build now removes development allowances and inline style permission; previews retain `blob:`.
- Image validation previously accepted a mere PNG/JPEG signature. Main now checks basic container structure and bounded dimensions before writing. This is structural validation, not a full image decoder or malware scanner.
- Startup could show an arbitrary internal exception in an error dialog. Unknown exceptions now get a generic message; known database errors remain specific.

## Remaining manual gates

After packaging is implemented, start the app twice, close/reopen and reload the window, check both themes, manually add/view each card category with an image, and run a real Play! scan. A 2xx response confirms only that the local endpoint accepted the request; inspect the game to confirm the in-game result. Verify packaged executable paths and Windows icon in that build.
