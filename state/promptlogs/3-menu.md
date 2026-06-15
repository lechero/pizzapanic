respect [AGENTS.md](AGENTS.md) / [rules-of-engagement-human-on-the-loop.md](state/rules-of-engagement-human-on-the-loop.md)

inspect the repo and plan to implement the following:

a static page at /menu with 8 pizza's defined as constants in the code:
 pizza
    - id
    - publicId
    - name
    - price
    - panicTime

this page should have a client-side basket and CTA on each pizza to add to the basket
we need a bottom sticky 1 line bar showing the selection and a CTA to a dialog to order
this dialog should show "name" and "address" input -> when submitted it should store and order with "status=received" -> 
after this it should redirect to /tracking/[trackingId] 

we will need an addition, and migration, to orders for this! customer_name and customer_address !


------- generated plan

# Menu Ordering Plan

## Summary
Add a static `/menu` page with 8 hard-coded pizzas, a client-side basket, a sticky selection bar, an order dialog, customer fields on orders, and a public `/tracking/[trackingId]` page. The menu submit will create an order with `status="received"` and redirect to tracking.

## Key Changes
- Add pizza constants in code, likely `lib/pizzas.ts`, with:
  - `id: string`
  - `publicId: string`
  - `name: string`
  - `price: number` in cents
  - `panicTime: number` in minutes
- Use these 8 defaults:
  - `margherita-meteor`, `PZA-001`, `Margherita Meteor`, `1095`, `12`
  - `pepperoni-afterburner`, `PZA-002`, `Pepperoni Afterburner`, `1395`, `14`
  - `funghi-frequency`, `PZA-003`, `Funghi Frequency`, `1295`, `13`
  - `nduja-volcano`, `PZA-004`, `Nduja Volcano`, `1495`, `10`
  - `pesto-paradox`, `PZA-005`, `Pesto Paradox`, `1350`, `15`
  - `truffle-timewarp`, `PZA-006`, `Truffle Timewarp`, `1695`, `18`
  - `bbq-moonbase`, `PZA-007`, `BBQ Moonbase`, `1450`, `16`
  - `garden-glitch`, `PZA-008`, `Garden Glitch`, `1250`, `11`
- Add `customerName` and `customerAddress` to the Drizzle `orders` schema as `customer_name` and `customer_address`, using not-null text columns with default `""` so existing rows migrate cleanly.
- Generate a Drizzle SQLite migration with `drizzle-kit generate --name add_order_customer_fields`; do not hand-write journal metadata unless generation fails.

## Implementation Details
- `/menu`:
  - Server page renders static menu data and delegates interactivity to a focused client component.
  - Each pizza has an Add CTA.
  - Basket stores quantities client-side; submit expands quantities into the existing `order: string[]` shape so no order item table is needed.
  - Bottom sticky one-line bar shows item count, compact selection summary, total price, and an Order CTA.
  - Order CTA opens a custom accessible dialog matching the existing in-repo modal style, with required `name` and `address` inputs.
- Menu order action:
  - Add `app/menu/actions.ts` with `"use server"`.
  - Validate customer fields are non-empty.
  - Validate submitted pizza ids against `lib/pizzas.ts`.
  - Call `createOrder({ status: "received", order, customerName, customerAddress })`.
  - `redirect("/tracking/" + createdOrder.trackingId)` after success.
- Existing order surfaces:
  - Update `db/orders.ts` input/update types and `toNewOrder`.
  - Update `/api/order` to accept, return, create, and patch `customerName` / `customerAddress`.
  - Update admin create/edit sheet, order table search, and detail view to show/edit customer fields since this platform is public.
- `/tracking/[trackingId]`:
  - Add a dynamic public page using `getOrderByTrackingId`.
  - Show tracking id, status, panic state, pizza ids, customer name/address, and courier if assigned.
  - Use `notFound()` for unknown tracking ids.

## Test Plan
- Run `corepack pnpm exec drizzle-kit check`.
- Run `corepack pnpm typecheck`.
- Run `corepack pnpm lint`.
- After migration is applied locally, manually verify:
  - `/menu` adds/removes basket items, keeps the sticky bar to one line, and opens/closes the dialog.
  - Submitting name/address creates an order with `status="received"` and redirects to `/tracking/[trackingId]`.
  - `/tracking/[trackingId]` loads the new order by tracking id.
  - `/orders`, `/orders/[id]`, and `/api/order` still work with the new customer fields.

## Assumptions
- `price` is stored as cents to avoid floating-point money issues.
- `panicTime` is display/menu metadata only for this change; the existing order `panic` boolean remains `false` on new menu orders.
- The existing `order` JSON string array remains the persisted basket representation; duplicate pizza ids represent quantity.
- No auth is added because everything on this platform is public.

