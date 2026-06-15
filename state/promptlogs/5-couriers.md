respect [AGENTS.md](AGENTS.md) / [rules-of-engagement-human-on-the-loop.md](state/rules-of-engagement-human-on-the-loop.md)

inspect the repo and plan to implement the following:

A client side page at /courier with 12 couriers defined as constants in the code (should be generated with happy names):
    couriers (12)
      - id
      - publicId 
      - name
Once a courier has been selected it should go to the courier page at /courier/[publicId] -> this should either:
    - show orders in "cooked" status -> so they can pick it up to transport -> once selected the order should go to "transit" -> 
      the courierId should be stored at order in this case
    - if an order exists with courier id and it's status is in transit -> show this order -> and a CTA to mark it as delivered

------ generated plan

Inspected the repo and rules. No files changed yet.
Findings
Couriers already exist as constants in [lib/kitchen.ts](/Users/miguelfuentes/projects/pizza-panic/lib/kitchen.ts): 12 rows with id, publicId, name.
Orders already have courierId in [db/schema.ts](/Users/miguelfuentes/projects/pizza-panic/db/schema.ts), so no migration is needed.
Statuses already include cooked, transit, delivered in [lib/order-statuses.ts](/Users/miguelfuentes/projects/pizza-panic/lib/order-statuses.ts).
Existing DB-backed pages use runtime = "nodejs", dynamic = "force-dynamic", async params, Server Actions, and revalidatePath.
Implementation Plan
Add courier lookup helpers in [lib/kitchen.ts](/Users/miguelfuentes/projects/pizza-panic/lib/kitchen.ts):
getCourierByPublicId(publicId)
optionally update names to explicitly cheerful names if you want “happy names” stricter than the current Ada/Bruno/etc.

Add order workflow helpers in [db/orders.ts](/Users/miguelfuentes/projects/pizza-panic/db/orders.ts):
listCookedOrders()
getTransitOrderForCourier(courierId)
pickUpCookedOrder({ orderId, courierId })
deliverCourierOrder({ orderId, courierId })
These should validate transitions server-side:
pickup only from cooked
pickup blocked if that courier already has a transit order
pickup stores courierId and sets status: "transit"
delivery only allowed for that courier’s transit order
delivery sets status: "delivered" and keeps courierId

Add /courier at [app/courier/page.tsx](/Users/miguelfuentes/projects/pizza-panic/app/courier/page.tsx):
client page with "use client"
render the 12 couriers from constants
selecting one navigates to /courier/[publicId]

Add /courier/[publicId]:
[app/courier/[publicId\]/page.tsx](/Users/miguelfuentes/projects/pizza-panic/app/courier/[publicId]/page.tsx)
[app/courier/[publicId\]/actions.ts](/Users/miguelfuentes/projects/pizza-panic/app/courier/[publicId]/actions.ts)
likely [app/courier/[publicId\]/_components/courier-board.tsx](/Users/miguelfuentes/projects/pizza-panic/app/courier/[publicId]/_components/courier-board.tsx)
page resolves courier by publicId; notFound() if invalid
if courier has an order in transit, show that order plus “Mark delivered”
otherwise show cooked orders with “Pick up” CTAs

Revalidate after actions:
/courier/[publicId]
/orders
/tony
/tracking/[trackingId] when the updated order has one

Verification Plan
Run corepack pnpm typecheck
Run corepack pnpm lint
Optional human runtime check per repo rules:start with task dev
open /courier
pick a courier
pick up a cooked order
confirm it changes to transit with that courierId
mark delivered
confirm status becomes delivered
