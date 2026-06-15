respect [AGENTS.md](AGENTS.md) / [rules-of-engagement-human-on-the-loop.md](state/rules-of-engagement-human-on-the-loop.md)

inspect the repo and plan to implement the following:
   
if max timeouts have been reached for and order/status according to defined constants:
        maxTimeouts: {
            received: number
            cooking: number ( + panicTimes bounces)
            cooked: number
            transit: number ( bit more since no distance data)
        }
        the dashboard should mark it as "panic" -> show UX badges/coloring 

add the maxTimeouts as constants like [pizzas.ts](lib/pizzas.ts) -> ensure timer badges are shown in courier and tony views! properly implement SSE according to our current implementation

timeouts generated should be between 30 seconds and 2 minutes


------- generated plan

I inspected the repo and will not mutate yet. Relevant rules read: [AGENTS.md](/Users/miguelfuentes/projects/pizza-panic/AGENTS.md), [rules-of-engagement-human-on-the-loop.md](/Users/miguelfuentes/projects/pizza-panic/state/rules-of-engagement-human-on-the-loop.md), and [SKILL-AGENT-drizzle-SSE.md](/Users/miguelfuentes/projects/pizza-panic/state/SKILL-AGENT-drizzle-SSE.md). I also checked the local Next 16 route-handler docs before planning SSE work.
Findings
Orders already have panic and panicFromStatus in [db/schema.ts](/Users/miguelfuentes/projects/pizza-panic/db/schema.ts).
SSE already exists at [app/api/orders/events/route.ts](/Users/miguelfuentes/projects/pizza-panic/app/api/orders/events/route.ts), backed by the in-process mutation bus in [lib/order-realtime/server.ts](/Users/miguelfuentes/projects/pizza-panic/lib/order-realtime/server.ts).
Tony and courier already call useOrderRealtimeRefresh, so timeout-generated panic updates should reuse the existing publish/refresh path.
Current timeout logic only checks cooking orders and only uses cookingStartedAt in [db/orders.ts](/Users/miguelfuentes/projects/pizza-panic/db/orders.ts). That cannot correctly time out received, cooked, or transit.
[db/order-panic-ticker.ts](/Users/miguelfuentes/projects/pizza-panic/db/order-panic-ticker.ts) exists, but I did not find it wired into app runtime. Tony currently ticks only during page render.
Worktree already has unrelated state/promptlog changes; I’ll leave them alone.
Implementation Plan
Add timeout constants in a small constants module, likely lib/order-timeouts.ts, similar to [lib/pizzas.ts](/Users/miguelfuentes/projects/pizza-panic/lib/pizzas.ts):
maxTimeouts.received
maxTimeouts.cooking
maxTimeouts.cooked
maxTimeouts.transit
Values will be explicit milliseconds or seconds, all between 30s and 2m.
delivered will not have a timeout.

Add a current-status timestamp to orders:
Add statusStartedAt / status_started_at to [db/schema.ts](/Users/miguelfuentes/projects/pizza-panic/db/schema.ts).
Generate a Drizzle migration and backfill existing rows from cookingStartedAt where available, otherwise Date.now()/SQLite current timestamp.
Keep cookingStartedAt for compatibility, but base all new timeout logic on statusStartedAt.

Update order write paths in [db/orders.ts](/Users/miguelfuentes/projects/pizza-panic/db/orders.ts):
New orders set statusStartedAt.
Status changes reset statusStartedAt.
Moving into cooking still sets cookingStartedAt.
Manual panic still sets panicFromStatus.

Replace tickOrderPanicState() logic:
Check all non-delivered statuses covered by maxTimeouts.
If statusStartedAt is missing, initialize it and publish an update.
If elapsed time exceeds the status timeout, set panic = true and panicFromStatus = current status.
Publish every timeout mutation through existing publishOrderUpdated, so Tony, courier, and tracking SSE clients refresh without a new transport.

Wire the ticker into the existing SSE lifecycle:
Start or ensure the panic ticker when /api/orders/events has active subscribers.
Keep using current SSE scopes: kitchen, courier, tracking.
Do not add a second SSE endpoint unless the current shape proves insufficient.

Add timer badge UX:
Add a reusable timer badge component/helper, probably beside PanicBadge.
Tony cards show timer state for active orders and panic cards.
Courier cards include timer state for cooked pickup orders and active transit orders.
Styling escalates as time runs out and uses destructive coloring once expired/panic.

Resolve the pizza.panicTime ambiguity during implementation:
Existing code treats it as minutes and menu text says min.
The new request says generated timeouts should be 30s to 2m.
My default assumption: maxTimeouts are seconds-based gameplay timers, and cooking timeout is maxTimeouts.cooking + first pizza panicTime as the current “first pizza” rule already does. I’ll update labels/helpers so the UI does not imply minutes if we use seconds.

Verification after implementation:
Run corepack pnpm typecheck.
Run corepack pnpm lint.
If migration is added, run Drizzle check/migration locally only within repo rules.
Ask you to runtime-check with task dev: open /tony and one /courier/[publicId], wait past a 30s-2m timeout, and confirm both views refresh via SSE and show panic styling.
