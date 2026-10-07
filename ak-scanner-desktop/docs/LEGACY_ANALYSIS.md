# Legacy application analysis (Phase 00)

## Evidence and scope

This is an audit of `../ak-scanner`; no legacy files or database records were changed. The user confirmed that the legacy database is SQLite, consistent with `.env` (`DB_CONNECTION=sqlite`, `APP_URL=http://ak-scanner.test`). The checked-in `database/database.sqlite` was opened read-only and its schema and aggregate counts inspected; it contains 52 Animal, 20 Strong, and 30 Miracle records. The user says this schema is active. The game runs locally through the Play! emulator; emulator internals are outside this rebuild's scope.

## Startup and request flow

1. XAMPP/PHP serves `public/index.php`, which loads Composer and bootstraps Laravel from `bootstrap/app.php`. The application registers `routes/web.php`, `routes/console.php`, the `/up` health route, default web middleware, and no custom middleware or exception configuration.
2. Blade views load Vite output for `resources/css/app.css`; `vite.config.js` also builds `resources/js/app.js`, but the views do not include that JavaScript entry. Tailwind and custom CSS provide the UI.
3. Browser requests use Laravel web routes, including CSRF protection for forms. `GET /` shows the home screen. `POST /send` validates a typed code and posts it to the local game endpoint.
4. The Animal, Strong, and Miracle catalogues each have list, add, edit, update, delete, and Use routes. List requests order by `created_at` descending, optionally filter `nama` with SQL `LIKE`, and paginate six records. Search parameters are appended to pagination links.
5. Create/update validates input, stores a new image in the `public` disk under `card_img/`, then writes the Eloquent record. Update/delete also remove old images. Successful mutations redirect to the catalogue. The Use actions post stored card codes to the local endpoint and redirect Animal → Strong → Miracle → Home; manual send stays on Home.

Sources: `public/index.php`, `bootstrap/app.php`, `routes/web.php`, `app/Http/Controllers/{Card,Animal,Strong,Miracle}Controller.php`, `app/Models/{Animal,Strong,Miracle}.php`, `config/filesystems.php`.

## Modules and dependencies

| Module | Behavior |
|---|---|
| Home/manual scanner | Form for one eight-character barcode and links to the three catalogues. |
| Animal | Name, rarity, gold attack, type, card code, image; first step in the guided Use sequence. |
| Strong | Name, rarity, three level values, aura, card code, image; second step. Levels are stored but not shown on catalogue cards. |
| Miracle | Name, rarity, effect, type, card code, image; final step. |
| Image storage | Laravel `public` disk at `storage/app/public`; views request `/storage/<path>` via `asset()`. Requires the configured `public/storage` link for browser access. In this checkout `public/storage` contains no files and the 103 image files are under `storage/app/public/card_img` (about 3.49 MB). |
| Framework infrastructure | Laravel 11/PHP 8.2, Eloquent, Blade, Vite 6, Tailwind 3. The `.env` currently chooses database sessions/cache/queue, log mail/broadcast, and local default disk. No application jobs, event listeners, scheduled tasks, mail sends, or broadcasts were found. |

The `User` model, auth configuration, user factory/seed, and standard Laravel users/session/cache/queue migrations exist, but no login, registration, auth middleware, user ownership, or authorization checks appear in application routes/controllers. All visitors who can reach the local web app can invoke catalogue actions. `routes/console.php` contains only Laravel's sample `inspire` command. Tests are framework example tests only.

## Operation and error behavior

The user opens the local web URL, enters a code on Home or chooses a catalogue, searches by name, adds/edits cards with optional image replacement on edit, deletes via browser `confirm()`, or clicks Use. CRUD has no visible success/error display in the Blade templates. Validation failures follow Laravel's normal redirect with errors, but the views do not render `$errors` or `old()` values. `CardController::send` checks HTTP success and places message/error in session; the three catalogue Use handlers ignore the returned status and redirect as though sending succeeded unless the HTTP client throws. Those messages also are not rendered by the current views. There is no application-specific recovery UI, service health check, settings screen, import/export, or background process.

## Unclear or apparently unused

- **UNCLEAR:** The exact response contract of the service on port 9876 and how Play! exposes or hosts that endpoint. Rebuilding does not require an emulator internals audit; verify the HTTP contract against the running game when integration work starts.
- **POSSIBLY_UNUSED / exclude from rebuild:** `resources/views/card.blade.php` is a hard-coded Brutus mockup with no route/reference; Laravel `User` authentication, seeder, queue/cache/mail/broadcast plumbing, and Axios bootstrap have no application call sites. `public/img/{brutus,strong,miracle}.jpg` are static assets; active catalogue views use uploaded image paths. The user explicitly does not want apparently unused features carried into the desktop version.

## User clarifications for the rebuild

Treat `../../answers.txt` as authoritative when older prompt wording conflicts. Keep the Play! game integration local. The desktop app does not need a Laravel-style web server port; choose one only if the desktop architecture truly requires it. Add detailed validation; category-specific filters; rarity sorting; feedback for success, failure, error, and warning; specific error messages; light/dark mode; a recognizable layout/colors; and an application icon. For game sends, do not add the CRUD success/error popup pattern, but do not let important failures pass silently. See the other Phase 00 documents for precise requirements.

Later decision: the user will enter cards manually in the desktop app. The legacy SQLite database and images remain read-only references; no data-transfer feature is planned. `MANUAL_DATA_ENTRY_PLAN.md` is the current workflow.
