import { OrderEditSheet } from "@/app/orders/_components/order-edit-sheet"
import { OrderTable } from "@/app/orders/_components/order-table"
import { listOrders, normalizeOrderDirection, normalizeOrderSort } from "@/db/orders"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type OrdersPageProps = {
  searchParams: Promise<{
    q?: string | string[]
    sort?: string | string[]
    dir?: string | string[]
  }>
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const params = await searchParams
  const query = firstParam(params.q)?.trim() ?? ""
  const sort = normalizeOrderSort(firstParam(params.sort))
  const direction = normalizeOrderDirection(firstParam(params.dir))
  const orders = await listOrders({ query, sort, direction })

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Orders</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Track kitchen status, panic state, pizza ids, and courier assignment.
          </p>
        </div>
        <OrderEditSheet mode="create" />
      </header>

      <OrderTable orders={orders} query={query} sort={sort} direction={direction} />
    </main>
  )
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}
