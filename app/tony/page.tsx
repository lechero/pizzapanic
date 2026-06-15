import { TonyBoard } from "@/app/tony/_components/tony-board"
import { listOrders, tickOrderPanicState } from "@/db/orders"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export default async function TonyPage() {
  await tickOrderPanicState()
  const orders = await listOrders({ sort: "trackingId", direction: "asc" })

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-[96rem] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3 border-b border-border pb-5">
        <p className="font-mono text-xs text-muted-foreground uppercase">
          Tony
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Kitchen board</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Move orders through the kitchen, mark panic, and keep oven and
              courier capacity enforced.
            </p>
          </div>
          <div className="font-mono text-xs text-muted-foreground">
            {orders.length} orders
          </div>
        </div>
      </header>

      <TonyBoard orders={orders} />
    </main>
  )
}
