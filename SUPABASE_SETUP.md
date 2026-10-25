# Kanvi Cloud Kitchen — Supabase setup

This ZIP now contains a Supabase-backed ordering starter. **It is not live until you complete these steps and test it.** Do not share your database service-role key with the browser or commit it to GitHub.

## 1. Create the project
1. Create a project at https://supabase.com/ and keep the project URL handy.
2. In Project Settings → API (or Connect), copy the Project URL and the **publishable/anon key**.
3. Edit `supabase-client.js` and replace `YOUR-PROJECT-REF` and `YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY`.
4. The key used in the browser must be the publishable/anon key only. Never use `service_role` or a secret key in frontend files.

## 2. Create the database
1. Open Supabase → SQL Editor → New query.
2. Paste the complete contents of `supabase/schema.sql` and run it once.
3. Check that `menu_items` contains the 23 seeded menu dishes.
4. **Before accepting real orders**, review every seeded price and set realistic starting stock quantities in `menu_items`. The current seed uses example stock of 10 servings per dish.
5. If `supabase_realtime` reports that a table is already in the publication, remove the repeated `alter publication` line and rerun only the remaining setup statements as appropriate.

## 3. Create and authorize the owner account
1. Supabase → Authentication → Users → Add user. Use the owner's email and a strong password.
2. Run this SQL after replacing the email with the exact owner account email:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"kanvi_owner"}'::jsonb
where email = 'owner@example.com';
```

3. Sign out and sign in again at `operations.html` so the refreshed session contains the updated app metadata.
4. Do not assign `kanvi_owner` through user-editable `user_metadata`; the dashboard checks trusted `app_metadata` and the database RPCs check the JWT role.

## 4. Run and deploy
- Test through a local web server or a static host (GitHub Pages/Netlify). Opening via `file://` can cause browser restrictions.
- Open `index.html`, place a test order, and verify that it appears in `operations.html` from a different browser/device.
- Test two simultaneous orders for the last serving; only available stock should be accepted.
- Test same request retry/network interruption; the idempotency key should return the same order instead of creating another one.
- Test status changes, cancellation stock restoration, sold-out visibility and owner sign-out.
- Use a test project first. Do not advertise the site as production-ready until tests pass.

## What is implemented
- Owner email/password login through Supabase Auth.
- Shared `orders` database and realtime updates for the owner dashboard.
- Server-side transactional order creation with a unique idempotency key, server-validated menu prices, stock locking and decrement, input validation and server-generated order code.
- Owner-only status changes and stock updates via protected RPCs.
- Cancelling an order restores reserved stock once; cancelled orders cannot be reopened by the current workflow.
- Customer menu checks public availability via a narrow RPC; direct table reads are not exposed to anonymous users.

## Important limitations / launch checklist
- The existing checkout still opens WhatsApp for the customer to tap **Send**. This does not automatically send a WhatsApp message. Automatic notifications need a WhatsApp Business Platform provider, approved templates where required, secret credentials stored server-side, and a separate Edge Function/webhook.
- Phone validation checks format, not ownership. Add OTP verification or manual owner confirmation if identity verification is required.
- Seeded stock starts at 10 servings and prices are copied from the current menu. Correct them before live use. `ingredient_cost` is not yet used for profit reports; set actual costs and add a server-side costing/reporting workflow before treating dashboard totals as profit.
- This starter does not provide payment processing, delivery-distance validation, tax/accounting compliance, automatic refunds, or full abuse-rate limiting. Add rate limiting/CAPTCHA and monitoring before public launch.
- Do not collect/store more customer data than needed. Set a retention policy and publish an appropriate privacy notice.


## v5 upgrade (single admin panel)
1. Re-run the complete `supabase/schema.sql` in the SQL Editor (safe to repeat). It adds menu columns, `get_public_menu`, `get_shop_settings`, `owner_upsert_item`, `owner_delete_item`, `owner_set_settings`, and a public `dish-images` Storage bucket (2 MB, jpeg/png/webp) where only the owner can upload.
2. If you see “Supabase Storage not found” in the SQL output, create a **public** bucket named `dish-images` in Storage and add insert/update/delete policies for authenticated users.
3. Sign in at `admin.html` with the owner account. Add dishes under **Menu & prices**; paste Swiggy/Zomato links under **Links & banner**.

## v8: order tracking
Re-run the full `supabase/schema.sql`. It adds `track_orders(jsonb)`, callable by anyone but only returns an order when both the order code and the phone number match. After that, customers see live status in My orders.
