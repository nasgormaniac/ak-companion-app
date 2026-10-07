# Data flow — Phase 01

## Boundaries

The React renderer holds display state only. The preload is a narrow bridge. Electron main is the only process that accesses SQLite, stored images, settings files, and the local game endpoint. No browser-to-Laravel requests or desktop inbound HTTP server are needed. See `TARGET_ARCHITECTURE.md` for the process map and `SECURITY_MODEL.md` for controls at each boundary.

## Catalogue read, search, filter, sort

1. User opens a category, searches by name, chooses category-specific filters, rarity direction, or a page.
2. React calls `cards.list({category, search, filters, raritySort, page, pageSize})` through the preload. UI constrains page size to six to preserve the legacy catalogue density.
3. Main checks the caller window, validates the object shape, category, filter names/options, sort direction, and bounded page number. It creates a parameterized SQLite query with an allowlisted sort expression, plus a count query.
4. Main returns card summaries, total count, and image URLs based on opaque card IDs. React renders cards and a meaningful empty state. No raw SQL or filesystem paths reach the renderer.

Default order remains newest first (`created_at DESC`, `id DESC`). When rarity sort is chosen, use the category's explicit rarity rank rather than alphabetic order: Animal common/bronze/silver/gold/ultra/kaiser; Strong and Miracle common/bronze/silver/gold. Direction reverses the rank, then uses stable timestamp/ID tie-breakers.

## Card create, edit, delete and image lifecycle

1. React gathers form values and a selected image via a narrow file chooser, then shows concise field guidance only where needed and specific validation errors after an invalid input.
2. Main receives the structured payload, validates name, category-specific enums and levels, image type/size, code format (`bn` + six compatible printable characters), and global code uniqueness. The original file path is never trusted as a destination.
3. Main stages a copied image under userData, writes the card record in a SQLite transaction, and finalizes the image reference. On failure it cleans staged files or records a recoverable cleanup task. On update/delete it removes the old image only after the DB change succeeds; failure to remove a file produces a warning rather than silent success.
4. The result contains a stable error code, specific safe message, and field errors if applicable. React shows CRUD success/failure/error/warning feedback and preserves the input for correction.

Image display resolves `cardId` in main, verifies the referenced path is inside the image directory, and responds with image bytes and the correct MIME type. React never supplies an arbitrary path to the image handler.

## Manual scan and saved-card Use

1. For manual entry, React sends the typed code through `scanner.sendManual`. Main applies the same code format rule used at create/edit. The code is sent as raw `text/plain` in an HTTP POST to `127.0.0.1:9876/sys147/barcode`.
2. For catalogue Use, React sends only the card ID through `scanner.sendSaved`. Main loads its stored code from SQLite and sends it without revalidating the stored value on every Use click, per the user's instruction. No renderer-supplied card code is trusted in this path.
3. Main enforces loopback destination, explicit timeout, bounded response handling, and interprets non-2xx/timeout/connection failure as failure. It never automatically retries a scan that might have reached the game. A 2xx means the endpoint accepted the request; the legacy source does not prove in-game completion.
4. React shows an inline/status result, not routine CRUD popups. It advances Animal → Strong → Miracle → Home only on accepted HTTP response; on failure it stays on the current screen and explains the known cause.

## Settings and theme

React requests `settings.get`; main reads a small validated local preference set. Theme choice is saved through `settings.update({theme})` and applied to design tokens. A game port override, if later needed, accepts only a valid port and still binds outbound requests to loopback. There is no user account, cloud synchronization, or shared data flow.

## First launch and ongoing manual entry

On first launch, main creates an empty versioned SQLite database and its image directory under userData. The catalogues show helpful empty states. The user adds cards through the same create flow described above, including selecting each image. Database and image backup/restore protect data entered in this app. No renderer or main-process operation opens the legacy SQLite file or copies its records/images. See `MANUAL_DATA_ENTRY_PLAN.md`.
