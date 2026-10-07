# Validation baseline (Phase 00)

All current product validation is inline in the four controllers. No Form Request classes, custom validation helpers, model-level validators, or database CHECK/enum constraints were found. `required`, `string`, `in`, `size`, `regex`, `image`, `mimes`, and `max` below are Laravel rules; update uses the same rules as create except image is optional.

| Input | Where enforced | Exact rules |
|---|---|---|
| Manual `code` | `CardController::send` | `required|string|size:8|regex:/^bn[a-zA-Z0-9]{6}$/` (lowercase `bn`, six ASCII alphanumeric characters). |
| All card `nama` | Three catalogue controllers, create/update | `required|string|max:255`. |
| All card `card_code` | Three catalogue controllers, create/update | `required|string|size:8|regex:/^bn[\w\S]{6}$/`. This accepts a much wider set than manual scanning; `\S` includes any non-whitespace character and `\w` is redundant here. No uniqueness rule. |
| Create `image` | Three catalogue controllers | `required|image|mimes:jpg,jpeg,png|max:1024`; max is 1024 KiB. |
| Replacement `image` | Three catalogue controllers, update when `hasFile('image')` | `image|mimes:jpg,jpeg,png|max:1024`; omission preserves old path. |
| Animal `rarity` | `AnimalController`, create/update | `required|in:common,bronze,silver,gold,ultra,kaiser`. |
| Animal `gold_attack` | `AnimalController`, create/update | `required|in:G,T,P`. |
| Animal `type` | `AnimalController`, create/update | `required|in:speed,multi,heavy`. |
| Strong `rarity` | `StrongController`, create/update | `required|in:common,bronze,silver,gold`. |
| Strong `guts_level`, `tech_level`, `power_level` | `StrongController`, create/update | Each `required|in:1,2,3,4,5`. |
| Strong `aura` | `StrongController`, create/update | `required|in:none,shining,defense,burning,evil,forest,miracle`. |
| Miracle `rarity` | `MiracleController`, create/update | `required|in:common,bronze,silver,gold`. |
| Miracle `effect` | `MiracleController`, create/update | `required|in:None,Slot Jammer,All Big,All Doubling,All Miracle,Lucky Chance,Lucky Break,All G,All T,All P,Resurrection,G Guard,T Guard,P Guard,Mystery Miracle`. |
| Miracle `type` | `MiracleController`, create/update | `required|in:speed,multi,heavy`. |

Blade forms use `required` on the main text fields and create image, `accept="image/*"` on file inputs, and select options matching the listed values. The browser `accept` filter is broader than the server's JPEG/PNG rule. The database enforces NOT NULL on most product columns and PKs, but not the value lists, barcode format, uniqueness, or cross-table integrity. Models only provide `$fillable` allowlists and search scopes. Delete and Use rely on route-model binding for ID existence and have no separate request validation.

## Known weaknesses

- Catalogue Use sends stored codes without revalidation. The user explicitly wants this behavior for saved cards in the desktop version; validation belongs at create/edit boundaries. A send failure still needs a visible, specific result.
- Catalogue code regex differs from manual code regex. The user wants one consistent rule in the desktop version. Read-only inspection of the active SQLite file found 102/102 codes are eight bytes, start with lowercase `bn`, and contain printable ASCII without whitespace; 88 use punctuation after `bn`. Therefore an alphanumeric-only rule would reject most existing cards. A rule compatible with observed data is `^bn[\x21-\x7E]{6}$`; verify the game contract before finalizing.
- The three Use actions do not check non-2xx HTTP responses; success messages and next-step redirects can be false positives.
- File storage and database writes/deletes are not transactional together. Failed DB operations after upload can leave orphan files; old images are deleted before confirming updated database persistence. A missing `public/storage` link can make valid uploads invisible in the browser.
- Blade views render no validation error messages or `old()` values. The Animal edit Gold option has malformed value markup, causing a likely validation failure when resubmitted.
- Names are printed with raw Blade output `{!! Str::limit(...) !!}` on catalogue cards. User-controlled markup may render as HTML/script; ordinary `{{ }}` escaping is used for other fields.
- No access control appears on mutation or send routes. The local setup may limit exposure operationally, but this is not enforced by application code.

## Desktop requirements confirmed by the user

- Validate code length exactly eight characters with `bn` prefix using the same rule for manual entry and create/edit. Preserve punctuation used by the existing database unless real game testing proves a narrower alphabet is necessary.
- Enforce card-code uniqueness for the desktop version, including across Animal, Strong, and Miracle. The user will enter cards manually; there is no legacy import conflict workflow.
- Show detailed field-specific validation errors. Important CRUD failures must never be silent. Use popup/toast/dialog feedback for CRUD success, failure, error, and warning; game sends need an explicit outcome but not routine CRUD-style popups.

Evidence: `app/Http/Controllers/{Card,Animal,Strong,Miracle}Controller.php`, `app/Models/*.php`, `resources/views/{index,animal/*,strong/*,miracle/*}.blade.php`, `database/migrations/*create_{animals,strongs,miracles}_table.php`.
