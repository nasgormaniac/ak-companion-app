# UI baseline (Phase 00)

## Screens and navigation

| Screen | Structure and behavior |
|---|---|
| Home (`/`) | Centered light-gray page with one white rounded panel. Left half: vertical barcode input and outlined blue Scan button. Right half: large stacked red Animal, green Strong, blue Miracle navigation buttons. |
| Catalogue (`/animal`, `/strong`, `/miracle`) | Centered max-width page. Top row has Home back link on left and category-colored Add button on right. Below is a rounded search input and yellow icon button. Main content is a card grid (one/two/three columns by viewport breakpoint), six records per page, with pagination underneath. No empty-state panel is coded. |
| Add/edit | Centered white rounded card on gray background, max width about 36rem. Paired fields in rows, category-specific selects, barcode field, image picker, red icon-only cancel/back link, wide blue Save button. Edit prepopulates stored values; image replacement is optional. |

The catalogue card places an image first; below are truncated name (15 characters) and colored rarity badge, secondary attributes and visible barcode, then Delete, Edit, and green Use actions. Animal secondary data: G/T/P gold attack and type. Strong: aura only; three level values exist in its form but are absent from the card. Miracle: effect and type. Delete invokes native browser `confirm('Are you sure?')`. There are no other modal/dialog components.

## Visual identity

Keep the gray/white base and blue action buttons, with category colors `animal #fe0a0a`, `strong #39ce14`, `miracle #029aff`, and gold accent `#EFBF04`. Rarity uses category color for common and bronze/silver/gold gradients; Animal adds blue Ultra and mixed gold/silver Kaiser gradients. The search button is yellow; Use is green; Delete red. CSS declares Nunito from Google Fonts for major home buttons with a local fallback; Tailwind config uses Figtree as its `sans` option. Source: `resources/css/app.css`, `tailwind.config.js`, and all active Blade views.

## Important behavior and limitations

- At small breakpoints CSS hides `.rarity` and `.info`, including the barcode and secondary card details; card actions remain visible. This is a legacy behavior, but rebuilding may improve accessibility while preserving hierarchy.
- No active view displays Laravel flash messages, validation errors, or preserved form input after redirect. The home Scan input has no visible label, and icon-only action buttons have no accessible names in source.
- Forms use HTML `required` on text name/code and create image inputs; server validation is authoritative. Select menus present category values. Edit image input has a `value` attribute in some views, which browsers do not use to prefill file selection.
- The Animal edit rarity option for Gold has malformed `value` markup (`value="gold {{ ... }}"`), so editing and resaving a Gold animal can submit an invalid rarity. See `resources/views/animal/editAnimal.blade.php`.
- The three catalogue pages do not have direct tabs between categories; Home is the common navigation hub. The Use workflow redirects to the next category.
- `resources/views/card.blade.php` is an unreferenced static sample and should not define the active UI.

The rebuild should preserve these page groups, placement, card hierarchy, color associations, and scan workflow. User-requested improvements: light/dark mode; category filters (Animal: rarity, gold attack, type; Strong: rarity, each of the three levels, aura; Miracle: rarity, effect, type); rarity sorting on all catalogues; success/failure/error/warning dialogs or toasts for CRUD actions; specific error text when the cause is known; and a desktop application icon. Keep the major layout/navigation and primary colors recognizable rather than redesigning the entire interface. Game send outcomes should use clear feedback without the CRUD popup/toast pattern.

The user supplied `../../app-icon.png`, a transparent 531×175 logo in the workspace root. Use it as the source for the Windows executable/installer icon after deriving a readable square treatment; do not treat a sample card image as the application icon.

## Later UI direction (user clarification)

The user wants a different font from the legacy visual treatment and restrained helper text. The Phase 03 preview now uses the local Windows Segoe UI family and removes redundant format, endpoint, port, and HTTP explanation copy. Keep the final UI similarly concise: labels and layout should usually explain ordinary controls; show specific validation or failure messages when an action needs correction. Do not repeat the `bn`/eight-character rule as a permanent hint beside the scan field.

The application's default language is English. Apply it consistently to UI labels, statuses, validation, and error messages; leave stored card names and domain option values intact. No language switcher has been requested.

## Phase 05 implementation

The React UI now has the legacy Home split: scanner on the left, stacked Animal/Strong/Miracle buttons on the right. Each category opens a catalogue with Home and Add actions, name search, six cards per page, image-first cards, rarity badges, category details, and Delete/Edit/Use actions. Add/Edit forms retain paired fields and the category-specific options. The stored-card Use flow advances Animal → Strong → Miracle → Home after an accepted HTTP response. The app starts with an empty catalogue so the first card can be added manually.

The catalogue adds the requested filters: Animal rarity/gold attack/type; Strong rarity/guts/tech/power levels/aura; Miracle rarity/effect/type. Every category can sort rarity ascending or descending, while the default order is newest first. Filters, search, and pagination run through the main-process SQLite repository. Images selected in the form are saved under Electron `userData/images`; the catalogue reads them through authenticated IPC. A replaced or deleted image is removed where possible, and a cleanup failure after deletion is shown as a warning.

The recognizable gray/white base, blue actions, category red/green/blue, gold search button, green Use, red Delete, rounded surfaces, and image-first card hierarchy remain. Modernized elements are Segoe UI, spacing, form controls, responsive grid, empty/loading states, colored feedback, and a named confirmation dialog. The permanent code-format hint is absent; specific validation messages appear after rejected input. UI labels and errors are in English.

CSS tokens in `src/renderer/styles.css` define background, surface, secondary surface, text, muted text, primary and hover primary, secondary, border, success, warning, error, shadow, plus category and gold colors. Light and dark palettes share the same layout and color associations. The theme toggle stores the choice in `localStorage`; without a saved choice, it follows the system's initial preference.

Accessibility improvements include visible labels, named category navigation and search controls, field-level error associations, focus outlines, live status/error feedback, a named delete dialog, responsive controls, and card image alternative text. The dialog's keyboard focus behavior can be further refined in the validation/accessibility phase.

Verification for Phase 05: Vite production build passed and 20 Node tests passed, including a new card IPC image/CRUD lifecycle test. Native window visual review remains to be done on the user's Windows session; Codex's sandbox cannot reliably launch Electron GUI.
