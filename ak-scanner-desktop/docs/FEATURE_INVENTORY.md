# Feature inventory (Phase 00)

Classification reflects observed source behavior, not a product decision about future scope.

| Feature | Class | Evidence and notes |
|---|---|---|
| Home manual barcode send | CORE | `GET /`, `POST /send`, `CardController`, `index.blade.php`; checks HTTP response status. |
| Three card catalogues and navigation | CORE | Animal, Strong, Miracle route groups and catalogue views; category colors and Home navigation. |
| Add/edit/delete card records and images | CORE | Three controllers/models, three sets of forms, public disk `card_img/`; delete uses browser confirmation. |
| Search by name and six-card pagination | CORE | Model `scopeFilter()` and controller `paginate(6)`; search form and pagination links on all catalogue pages. |
| Stored-card Use and Animal → Strong → Miracle sequence | CORE | Three `useCard()` actions post raw codes to port 9876 and redirect. HTTP success is not checked in these actions. |
| Category attributes/rarity visualization | CORE | Fields and options in forms, colored badges and card details in lists. Strong levels are form-only on lists. |
| Upload replacement and physical image deletion | SECONDARY | Update/delete methods use `Storage::disk('public')`; desktop cards and their newly selected images need equivalent lifecycle handling. |
| Browser CSRF protection and Laravel route-model binding | SECONDARY | Web middleware, Blade `@csrf`, typed model parameters. |
| Native delete confirmation | SECONDARY | `confirm('Are you sure?')` in all three catalogue views. |
| Health route `/up` | SECONDARY | Registered in `bootstrap/app.php`; no UI link. |
| Laravel framework users/password reset/factory/seed | INTENTIONALLY_EXCLUDED from desktop | Standard files and migrations exist, but no auth routes or checks. User confirmed framework tables need not be copied when unused. |
| Queue, cache, sessions, mail, broadcast framework configuration | INTENTIONALLY_EXCLUDED from desktop | `.env` selects database drivers for queue/cache/sessions, but no product jobs/mail/broadcast found; sessions do carry flash messages. Desktop feedback does not require Laravel sessions. |
| Axios bootstrap and Vite JS entry | POSSIBLY_UNUSED | `resources/js` only imports/configures Axios; active views include CSS entry only and contain no Ajax calls. |
| Hard-coded `card.blade.php` and sample images | POSSIBLY_UNUSED | No route/render reference; active cards come from database uploads. |
| Legacy SQLite data transfer | REMOVE_WITH_JUSTIFICATION | User chose to enter cards manually in the desktop app. The read-only audit found 52 Animal, 20 Strong, 30 Miracle records, but these are reference data only; no importer or automatic transfer is needed. |
| Manual desktop card entry | CORE (desktop workflow) | Fresh SQLite starts empty; user creates cards and selects images through the app. See `MANUAL_DATA_ENTRY_PLAN.md`. |
| Game service identity, availability, response payload, scan completion | UNCLEAR | Only the outbound HTTP POST contract is visible in source. |
| User preferences/settings | UNCLEAR | No settings UI, persistence, or theme switch found. Whether users rely on external configuration is unknown. |

| Category filters and rarity sorting | CORE (desktop addition) | User requested Animal: rarity/gold attack/type; Strong: rarity/three levels/aura; Miracle: rarity/effect/type. Rarity sort applies to all three. |
| Desktop feedback, detailed validation, theme, icon | CORE (desktop addition) | User requested CRUD success/failure/error/warning feedback, specific errors, consistent eight-character `bn` code validation, light/dark mode, and an application icon. |

No application-specific scheduled job, WebSocket, direct TCP/UDP socket, process execution, game filesystem access, data import/export, or external account integration was found in first-party source. External Google Fonts is a UI asset request, not a product data integration. The user explicitly excludes the possibly unused features above from the desktop rebuild.
