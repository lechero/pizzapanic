respect [AGENTS.md](AGENTS.md) / [rules-of-engagement-human-on-the-loop.md](state/rules-of-engagement-human-on-the-loop.md)

inspect the repo and plan to implement the following:

adjust the root page at / to display:

- Menu
----
- Be Courier
- Be Tony
----
- Panic Attack

panic attack should call the /api/panic endpoint which will generate between 5 and 20 random orders and send it to the system. This will allow us to test the panic timers and SSE updates in real-time.

----------- generated plan


Inspected and planned. No files changed.
Findings
Root page is still template content: [app/page.tsx](/Users/miguelfuentes/projects/pizza-panic/app/page.tsx).
Order creation already publishes realtime events through createOrder() in [db/orders.ts](/Users/miguelfuentes/projects/pizza-panic/db/orders.ts), so /api/panic should reuse that instead of inserting directly.
SSE is already wired at [app/api/orders/events/route.ts](/Users/miguelfuentes/projects/pizza-panic/app/api/orders/events/route.ts), with Tony/courier clients refreshing through useOrderRealtimeRefresh.
Panic timers are already active through retainOrderPanicTicker() when SSE clients connect.
Local Next docs confirm app/api/.../route.ts route handlers with POST and Response.json are the right shape.
Implementation Plan
Replace [app/page.tsx](/Users/miguelfuentes/projects/pizza-panic/app/page.tsx) with a simple operational menu:
Menu link to /menu
separator
Be Courier link to /courier
Be Tony link to /tony
separator
Panic Attack action button

Add a small client component for the Panic Attack button, likely under app/_components/, so the root page can stay mostly server-rendered while the button can POST /api/panic.

Add [app/api/panic/route.ts](/Users/miguelfuentes/projects/pizza-panic/app/api/panic/route.ts):
runtime = "nodejs"
dynamic = "force-dynamic"
POST only
generate a random count from 5 to 20
create random orders using existing createOrder()
randomize pizza IDs from [lib/pizzas.ts](/Users/miguelfuentes/projects/pizza-panic/lib/pizzas.ts)
use generated test customer names/addresses
return { count, orders } or a minimal { count }

Keep generated orders as normal received orders unless you want aggressive timer coverage across all statuses. This preserves kitchen workflow and still tests SSE immediately via creation events, then panic timers after the configured timeout.

Verification:
Run corepack pnpm typecheck
Run corepack pnpm lint
Human runtime check: start task dev, open /tony, open /, click Panic Attack, confirm Tony updates without refresh, then wait for timer-driven panic updates.
