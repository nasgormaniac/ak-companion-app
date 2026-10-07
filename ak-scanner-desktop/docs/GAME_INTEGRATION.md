# Local game integration

## Phase 03 implementation

The desktop integration is implemented in `src/main/gameService.cjs`, with the fixed protocol constants and validation in `gameProtocol.cjs`. React calls the narrow preload API in `src/preload/preload.cjs`; `gameIpc.cjs` validates the sender frame and arguments; only Electron main sends the HTTP request. No desktop HTTP server or inbound port is created.

| Item | Desktop behavior |
|---|---|
| Destination | `http://127.0.0.1:9876/sys147/barcode` by default. The host and path stay fixed; the user may change only the local destination port (1–65535). The setting is saved under Electron `userData/data/game-settings.json`. |
| Request | One `POST` per click, `Content-Type: text/plain`, raw UTF-8 barcode body, no JSON wrapper or authentication header. The manual field requires exactly eight printable ASCII characters beginning with lowercase `bn`; punctuation is accepted. |
| Response | Any HTTP 2xx is treated as acceptance by the local service. The response body has no known contract and is not displayed or parsed. Response data is bounded to 4096 bytes. Non-2xx is a failure with its HTTP status. Acceptance does **not** confirm that the game completed a scan. |
| Timing | A request has a 4-second total deadline. Only one send may be active at a time. There is no automatic retry because a timed-out request could already have reached the game. Closing the application aborts active requests. |
| Status | `DISCONNECTED` initially/after changing port or closing, `CONNECTING` while sending, `CONNECTED` after a 2xx response, `CONNECTION_FAILED` after a network/HTTP error, and `INVALID_CONFIGURATION` for an invalid port. Status describes the **last request**, not a continuous connection or background health check. |
| Visible errors | Manual code: `INVALID_CODE`; bad port: `INVALID_CONFIGURATION`; connection refused: `LOCAL_SERVICE_NOT_RUNNING`; timeout: `TIMEOUT`; malformed or oversized HTTP response: `INVALID_RESPONSE`; other network failures: `CONNECTION_FAILED`; non-2xx: `HTTP_ERROR` plus status; repeated click: `SEND_IN_PROGRESS`. The renderer displays the result inline rather than using CRUD toasts. |

The preload also exposes `sendSaved(cardId)`. Its IPC handler accepts a positive integer ID, looks up the code in **main**, and passes the stored code to the game service without repeating manual code validation. Phase 04 connected this lookup to the SQLite card repository. The preview UI still has no catalogue Use button; that UI belongs to a later phase. The renderer never supplies a saved card's code directly.

Security boundaries: the renderer cannot choose a host, path, HTTP method, or arbitrary URL. The destination is loopback only. IPC requests must come from the app's main frame at its exact trusted URL. The BrowserWindow uses context isolation, disabled Node integration, a sandboxed renderer, blocked extra windows/navigation, and denied permission requests. The production page has a CSP. The game endpoint has no observed authentication, so its exact acceptance behavior still requires a live game check.

Live check on 2026-10-06: with Animal Kaiser open in Play! but not yet past Start, `Play.exe` (PID 17420 at the time) listened on TCP port 9876. One existing Animal card code was sent through `GameService.sendManual`; the local endpoint returned HTTP 200 and the service reported `CONNECTED`. The legacy SQLite database was read only. The user accepted this as a provisional success for the HTTP integration; the in-game effect was not observed because the game had not been started. `netstat` showed Play! listening on `0.0.0.0:9876`, although the desktop client always connects to `127.0.0.1`; exposure to other machines depends on the user's host firewall and Play! configuration.

## Additional desktop reference (read only)

`../AK-Card-Scanner-2.0.0` is a separate C# WinForms application for the same Play! feature, used only as a behavior reference. Its `MainForm.cs` also targets `http://127.0.0.1:<port>/sys147/barcode` with default port 9876 and sends the raw barcode string in a POST. It labels the Play! service the “Arcade I/O HTTP Server.” Its `StringContent` uses `application/json`, while our legacy Laravel app uses `text/plain`; our `text/plain` request received HTTP 200 in the live check, so the desktop implementation keeps the legacy format rather than adopting that differing header.

Its optional “Scan All” routine sends Animal immediately, Strong about 4 seconds later, and Miracle about 1 second after Strong. The source comments attribute the first delay to an in-game scan animation. This is useful context if a batch-send feature is added in a later phase: sequence and delay need game testing, each HTTP send should be awaited and checked, and failure should stop the remaining sends. The current desktop plan uses user-driven Animal → Strong → Miracle steps, so it does not add a timer or automatic batch here. The reference's optional empty-body “Ping” POST is also not required for normal sending; current status describes the last real send.

To run the preview, run `npm install` in `ak-scanner-desktop`, then `npm run build` and `npm start`. For development, run `npm run dev:renderer` in one terminal and set `AK_SCANNER_DEV_URL=http://127.0.0.1:5173` before `npm run dev:electron` in another. Run protocol and IPC tests with `npm test`. With a local copy of Node 23.7.0 and dependencies installed by the user, all ten Node tests and the Vite production build passed on 2026-10-05. The Play! endpoint returned HTTP 200 in the live check above; the game-side effect remains unobserved.

## Legacy observed communication (Phase 00)

| Call sites | Class | Initiator and destination | Protocol and payload | Observed response handling |
|---|---|---|---|---|
| `CardController::send`, `AnimalController::useCard`, `StrongController::useCard`, `MiracleController::useCard` | GAME_COMMUNICATION (service identity **UNCLEAR**) | Laravel/PHP initiates `POST` to `http://127.0.0.1:9876/sys147/barcode` on the same computer. | HTTP over TCP, `Content-Type: text/plain`; raw body is the eight-character `card_code` string, with no JSON wrapper. No authentication header is set. | Manual send checks 2xx via `successful()`, includes HTTP status and failure body in a session flash. Catalogue Use actions assign the response but do not check status/body; they report success and advance unless an exception occurs. |
| Browser forms/links to Laravel routes `/`, `/send`, `/animal*`, `/strong*`, `/miracle*` | LARAVEL_BACKEND_COMMUNICATION | Browser initiates GET/POST/PUT override/DELETE override to the local Laravel web origin (`APP_URL` currently `http://ak-scanner.test`; user states normal Laravel default port when using `artisan serve`, i.e. 8000). | HTML forms with CSRF tokens on POST, PUT, DELETE; multipart form data for image uploads. | Laravel redirects/renders Blade. |
| Eloquent models and database-backed framework drivers | DATABASE_COMMUNICATION | Laravel initiates database calls. | `.env` selects SQLite, consistent with the user's clarification. The active database file path outside this checkout, if any, is **UNCLEAR**. | Framework handles query errors; no application-specific retry. |
| Google Fonts `@import` in `resources/css/app.css` | UNKNOWN external UI dependency, not game communication | Browser fetches Nunito stylesheet from `https://fonts.googleapis.com/...` when online. | HTTPS. | No fallback handling beyond CSS font stack. |
| Vite dev server / `npm run dev`, `php artisan serve` in Composer `dev` script | DEVELOPMENT_ONLY | Browser/build tooling during development. | Development HTTP/HMR ports are not pinned in source. | Not required by production behavior. |

Evidence: `app/Http/Controllers/*Controller.php`, `routes/web.php`, `resources/views/**/*.blade.php`, `composer.json`, `resources/css/app.css`, `config/database.php`, `.env` connection/URL keys (secrets omitted).

## Workflow and exact known contract

The catalogue Use sequence is Animal → Strong → Miracle → Home. The transitions are Laravel redirects after each POST, not state enforced by the service or database. Manual Home scanning can send any valid code independently. Both paths send a raw eight-character code. Manual validation requires lowercase `bn` plus six ASCII letters/digits; stored catalogue codes are validated differently (see `VALIDATION_BASELINE.md`). Therefore legacy stored codes may contain characters that manual entry rejects.

No WebSocket, raw TCP/UDP socket, process launch, game file read/write, localhost polling, or inbound game callback was found in application code. The app does not show a service availability test. The Laravel HTTP client uses its default timeout/retry configuration; no explicit timeout or retry is configured in these calls.

## User clarification and unknowns to verify with the running game

- The game runs locally using the Play! emulator. There is no need to investigate emulator internals for the rebuild. Preserve the observed loopback HTTP endpoint and test it with the running game when possible.
- The desktop application does not need to expose the legacy Laravel HTTP port. Choose a desktop-side port only if technically necessary. Port 9876 is the separate observed game/service endpoint.
- Feedback convention: popup/toast success/error feedback is requested for CRUD (especially adding cards), not routine game sends. Nevertheless, a failed game send must remain visible and specific; use an appropriate inline/status treatment rather than reporting false success.
- **UNCLEAR:** Whether Play! itself or a helper owns port 9876, startup order, and whether the endpoint path is stable.
- **UNCLEAR:** Exact accepted barcode alphabet, encoding, case behavior, newline tolerance, and whether successful requests return a body/status other than HTTP 2xx.
- **UNCLEAR:** Whether the service requires the game to be at a particular screen, whether repeated sends are safe, and whether Animal/Strong/Miracle order is required by the service.
- **UNCLEAR:** How to distinguish a completed scan from a merely accepted HTTP request. The source has no acknowledgement beyond HTTP status.
