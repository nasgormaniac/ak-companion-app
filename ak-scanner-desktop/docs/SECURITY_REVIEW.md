# Phase 08 security review — 7 October 2026

## Electron and IPC

| Check | Finding |
|---|---|
| Renderer privileges | `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true`. Preload exposes named game/card methods only; no generic `ipcRenderer`, Node object, shell, or filesystem method. |
| IPC caller | Main verifies the exact BrowserWindow webContents, main frame, and trusted URL. Card/game handlers validate arity, IDs, types, allowed fields and values. SQLite adds CHECK and global UNIQUE constraints. |
| Navigation/URLs | New windows are denied, unexpected navigation is prevented, and permission requests are denied. No `openExternal` or arbitrary remote URL launcher. Development renderer is fixed to `127.0.0.1:5173`; production loads a local file. |
| Renderer filesystem | Renderer cannot pass an arbitrary path. Images get random internal names under userData; reads require a strict generated-name pattern. Database and settings are handled in main. |
| Shell and secrets | No renderer shell execution or shell command bridge found. No hardcoded credential/token found in app source. The local endpoint address is a protocol setting, not a secret. |
| CSP | Production HTML allows only self scripts/styles/connections, self/data/blob images, and denies objects, base URI, and forms. Development-only loopback/HMR connection and inline style allowance are stripped at build time; test checks both forms. |

The configuration follows Electron's [security checklist](https://www.electronjs.org/docs/latest/tutorial/security) and [context isolation guidance](https://www.electronjs.org/docs/latest/tutorial/context-isolation). Runtime GUI and packaged behavior still need direct inspection.

## Local data and game boundary

- The game sender uses `http.request` to fixed `127.0.0.1:<validated-port>/sys147/barcode`, with POST `text/plain`, a deadline, capped response, one in-flight send, and no automatic retry. The configured port changes the next send, never the host or route. A successful HTTP status is reported as endpoint acceptance only.
- Card queries use parameterized statements and allowlisted filter/sort inputs. The database is checked for integrity, unknown/newer schemas are preserved, upgrades run transactionally, and a pre-upgrade backup includes images. A single-instance lock avoids concurrent application windows sharing the same DB/image directory.
- Image input is capped at 1 MiB, requires matching PNG/JPEG MIME and basic container structure, checks dimensions, and is saved with a generated name. PNG CRC and complete pixel decoding are not verified by main; malformed content may still fail to display. Stored images are local unencrypted files in the user's Electron userData, so OS users with access to that profile can read them.
- A failed image cleanup produces visible warning and orphan cleanup retries on later starts. The DB record remains authoritative if file deletion fails.

## Dependencies and advisories

`npm ls --depth=0` showed five direct packages, all in use: React and React DOM for the UI, Vite and its React plugin for the build, and Electron for the desktop runtime. No unused direct dependency was identified, so none was removed. Electron's installed distribution is about 385 MB; that size belongs to the required Chromium/Node desktop runtime, not an extra library. No deprecated package marker was found in the lockfile/installed package metadata.

`npm audit --offline --json` reported **0 known vulnerabilities across 57 dependencies in the locally cached advisory data**. A live `npm audit` could not reach the registry from this environment, so this is not a current online clearance. The official [Electron advisory list](https://github.com/electron/electron/security/advisories) was reviewed; the examined Electron 44 beta advisories [GHSA-j84w-jfhq-vhvj](https://github.com/electron/electron/security/advisories/GHSA-j84w-jfhq-vhvj) and [GHSA-gr2m-v5gq-v685](https://github.com/electron/electron/security/advisories/GHSA-gr2m-v5gq-v685) describe prerelease versions below beta.5, while this app uses Electron 44.5.1. This review is bounded by the available advisories and offline audit cache. Dependencies were not upgraded blindly.

## Residual risks and follow-up

- Run a live dependency audit once registry access works, then assess any result before upgrading.
- Test the final packaged Windows executable, including navigation, icon, resource paths and CSP in the actual window.
- Real Play! behavior requires an observed in-game scan. The local endpoint is another process on the same machine and should be treated as untrusted; the app already bounds its response but cannot prove the game acted on a 2xx.
