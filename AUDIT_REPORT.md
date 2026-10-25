# Kanvi Cloud Kitchen — audit and fixes

## Issues found and fixed in this pass

1. **Cancellation could restore inventory ambiguously for repeated dish lines.** Cancellation now aggregates quantities by menu-item name before restoring stock.
2. **Order status could be moved backwards or reopened after delivery.** The database now enforces a forward-only workflow: Awaiting confirmation → Confirmed → Preparing → Ready → Delivered, with cancellation allowed only before preparation starts, so prepared food is not incorrectly added back to available stock. Re-saving the same status is harmless.
3. **A malformed/null cart could slip past the SQL array check.** The order RPC now explicitly rejects null and non-array payloads and validates missing quantities.
4. **Server-confirmed prices could differ from the itemized WhatsApp message if the menu was stale.** The RPC returns server-normalized items and the checkout uses those server-calculated line totals.
5. **A storage write failure after the database accepted an order could lose the retry key.** The browser now clears the idempotency key only after its local order record is written, allowing retries to resolve to the original server order when local storage fails.
6. **The unconfigured site could make a local-only reference look like a shared database order.** The checkout now warns that the shared owner dashboard is not updated until Supabase is configured and uses a `LOCAL-` reference in fallback mode.

## Checks run

- JavaScript syntax checks passed for `index.html`, `operations.html`, `admin.html`, `menu.js`, and `supabase-client.js` using Node.js `--check`.
- Asset paths referenced by the menu are checked in the package.
- ZIP contents are kept at the archive root for straightforward deployment.

## Still required before real customers use it

- Set the real Supabase project URL and publishable key in `supabase-client.js`.
- Run the complete `supabase/schema.sql` in a test Supabase project and authorize the owner using the setup guide.
- Confirm real menu prices and initial stock quantities; the seed stock is demo data.
- Test concurrent orders for the last serving, cancellation/restoration, and status transitions against the actual Supabase project.
- Automatic WhatsApp messages are not implemented. Customers still have to tap **Send** in WhatsApp; automatic notifications need a server-side WhatsApp Business Platform integration.
- Phone format validation is not phone ownership verification. Add OTP or a manual confirmation process if needed.
- Ingredient-cost fields are present, but full profit reporting (packaging, delivery, wastage, taxes, payment fees) is not yet implemented.
- This static frontend has not been tested against your actual Supabase credentials or deployed hosting environment in this session.

## v4 pass (tested)

- **Schema tested on real PostgreSQL 16** (Supabase auth/roles stubbed): runs twice without errors; anon order succeeds; anon cannot read tables; non-owner sees 0 orders; cancel restores stock; cancelled order cannot be reopened; over-stock order rejected.
- **operations.html:** status/stock/error messages were written into the hidden login panel, so the owner never saw them after signing in. Added a visible toast. Status dropdown now lists only valid next states (matches the DB workflow).
- **index.html:** after a failed order (e.g. out of stock) the menu availability is re-synced.
- **schema.sql:** owner-only RPCs explicitly revoked from `anon` (Supabase grants EXECUTE to anon by default).
- Checkout flow smoke-tested in jsdom with a mocked Supabase client: cart → RPC → WhatsApp link → cart cleared.
- Still NOT tested here: your real Supabase project, real realtime updates, real phones.


## User-requested WhatsApp number verification (2026-10-25)

- Confirmed the shop WhatsApp number in `menu.js` is `916303585986`, matching `+91 63035 85986`.
- Confirmed the restaurant structured-data telephone in `index.html` matches the same number.
- Customer WhatsApp ordering, click-to-call, and the “Ask on WhatsApp” menu fallback all use the shared `SHOP.phone` configuration.
- Re-ran Node.js syntax checks for `menu.js`, `supabase-client.js`, and inline JavaScript in `index.html`, `operations.html`, and `admin.html`; all passed.
- Supabase configuration placeholders remain intentionally unconfigured and must be replaced with the owner's real project URL and publishable/anon key before shared-database features can work. No secrets were added.


## v5 pass
- Merged admin.html + operations.html. Menu source of truth moved to the database (menu.js = fallback).
- Fixed: dish names containing an apostrophe broke the Add button (inline onclick); names/descriptions are now HTML-escaped on the customer site.
- Fixed: offer price was display-only; server now charges the offer price.
- Links from the database are only applied if they start with http(s):// (checked in SQL and in the browser).
- Checked: Node syntax checks; jsdom smoke tests with a mocked Supabase client (live menu load, Swiggy/Zomato buttons, apostrophe dish add-to-cart at offer price, admin add-dish payload, settings save).
- NOT tested: the new SQL on a real PostgreSQL/Supabase project (no database was available here), photo upload to real Storage, real phones. Run the SQL in a test project first.

## v8 pass
- Automated browser checks (mock Supabase, 22 checks, all passing): manifest + icons, service worker + cache, offline reload, My orders empty state, tracker opens after an order, status steps update (Cooking / Cancelled / Delivered), Order again skips sold-out dishes, admin alert toggle, beep on new order only, tab title count.
- NOT tested: real Supabase (`track_orders`, realtime), real phone install prompt, iPhone Add to Home Screen, push when the app is closed (not implemented).
- Service worker never caches Supabase API calls; HTML/JS/CSS are network-first (4 s timeout) so deployments show up; images and CDN files are stale-while-revalidate.
