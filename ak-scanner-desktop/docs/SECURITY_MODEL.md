# Security model — Phase 01

## Assets and trust boundaries

Assets are the card SQLite database, manually selected card images, theme/game endpoint settings, local game send capability, backups, and installer identity. The renderer receives UI data and can request specific operations; it is less trusted than the main process. Image uploads are untrusted input even when selected by the user. The game endpoint is a separate local process whose response does not automatically prove in-game success.

| Boundary | Planned control |
|---|---|
| Packaged UI → Electron privileges | `contextIsolation: true`, `nodeIntegration: false`, renderer sandbox where compatible, narrow `contextBridge` API. No generic IPC or Node objects exposed. |
| Renderer → IPC handler | Check sender frame/origin against the app's packaged UI, allowlist channels, validate complete payload shape/size and record IDs in main. Return structured safe errors. |
| Renderer → navigation/network | Load only packaged UI. Block unexpected navigation/window creation and external URLs by default; no remote scripts or Google Fonts dependency in production. Restrictive CSP. |
| Main → SQLite | Parameterized queries, allowlisted filter/sort columns, global `UNIQUE(card_code)`, category constraints, bounded pagination, migration/backup before changes. |
| Main → image storage | OS picker only for user-selected files; validate MIME/signature and size; generate internal filenames; resolve paths under userData image root; no arbitrary path read/write through IPC or custom protocol. |
| Main → local game | Fixed `http://127.0.0.1:9876/sys147/barcode` by default, loopback-only optional port override, POST text payload, timeout, bounded response, no automatic resend. Do not turn IPC into a general URL fetcher. |
| First launch → desktop storage | Create only the target database and owned image directory under userData. Never open or modify legacy SQLite/images as part of runtime startup. |

These controls align with Electron's [security checklist](https://www.electronjs.org/docs/latest/tutorial/security), [context isolation guidance](https://www.electronjs.org/docs/latest/tutorial/context-isolation), and [preload guidance](https://www.electronjs.org/docs/latest/tutorial/tutorial-preload). Final settings must be verified in actual Electron startup and packaged builds.

## Threats and failure handling

- **Injected card name or form text:** React renders as text, never HTML. The legacy Blade card title used raw HTML output; do not carry that behavior forward. CSP and renderer isolation reduce impact if UI injection occurs.
- **Malformed image or path traversal:** accept only supported JPEG/PNG by content and bounded size; never interpolate a stored or renderer path into file access without canonical containment checks. The image URL uses card ID, and main resolves the owned path.
- **Unexpected IPC request:** reject unknown channels, extra keys where risky, invalid types, huge strings, unsupported enums, and calls from unexpected frames. Validate again in main even if React validated already.
- **Duplicate or malformed card code:** one authoritative format for manual Scan and card create/edit. Global uniqueness is enforced in SQLite; main converts constraint failures into specific errors. Legacy examples use punctuation after `bn`, so alphanumeric-only validation would block codes the user may type manually.
- **Local service failure:** distinguish connection refused, timeout, non-2xx, and malformed response when known. Never claim success or advance the three-step flow on HTTP failure. A 2xx only means request accepted by that HTTP endpoint. Do not log full codes or raw response bodies unnecessarily.
- **Partial image/DB operation:** stage images, use SQLite transactions, and make file cleanup/recovery visible. Keep old image until record update succeeds. Recover or report orphaned staged files after crash.
- **Database corruption or failed schema upgrade:** back up before schema upgrades; run integrity checks; preserve the previous desktop DB and images until verification passes. SQLite's [online backup API](https://www.sqlite.org/backup.html) provides consistent database snapshots.
- **Local privacy:** data is per Windows user profile in Electron userData, with no cloud synchronization or shared user database. OS users with access to that profile can read unencrypted app files; encryption is not specified by the product requirements.

## Explicit non-goals and open questions

The app does not host an HTTP API, implement login/accounts, or inspect Play! internals. A live check found Play! listening on port 9876 and returning HTTP 200; the in-game effect still needs observation. The icon source is now available at `../../app-icon.png` for packaging. Security review in Phase 08 must confirm these planned controls, not merely assume Electron defaults.
