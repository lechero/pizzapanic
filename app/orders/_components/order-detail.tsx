"use client"

import Link from "next/link"
import { ArrowLeft, Trash2 } from "lucide-react"

import { deleteOrderAction } from "@/app/orders/actions"
import { OrderEditSheet } from "@/app/orders/_components/order-edit-sheet"
import { OrderStatusBadge, PanicBadge } from "@/app/orders/_components/order-status-badge"
import { Button } from "@/components/ui/button"
import type { Order } from "@/db/schema"

export function OrderDetail({ order }: { order: Order }) {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <Button asChild variant="ghost" size="xs" className="-ml-3 mb-3">
            <Link href="/orders">
              <ArrowLeft />
              Orders
            </Link>
          </Button>
          <h1 className="truncate font-mono text-2xl font-semibold">{order.trackingId}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{order.id}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <OrderEditSheet order={order} mode="edit" triggerLabel="Edit order" />
          <form
            action={deleteOrderAction}
            onSubmit={(event) => {
              if (!window.confirm(`Delete ${order.trackingId}?`)) {
                event.preventDefault()
              }
            }}
          >
            <input type="hidden" name="id" value={order.id} />
            <Button type="submit" variant="destructive" size="sm">
              <Trash2 />
              Delete
            </Button>
          </form>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="Status">
          <OrderStatusBadge status={order.status} />
        </Metric>
        <Metric label="Panic">
          <PanicBadge panic={order.panic} />
        </Metric>
        <Metric label="Courier">
          <span className="font-mono text-sm">{order.courierId ?? "unassigned"}</span>
        </Metric>
        <Metric label="Pizzas">
          <span className="font-mono text-sm">{order.order.length}</span>
        </Metric>
      </section>

      <section className="border border-border">
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Pizza IDs</h2>
        </div>
        <div className="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-3">
          {order.order.map((pizzaId) => (
            <div key={pizzaId} className="border border-border bg-muted/30 px-3 py-2 font-mono text-sm">
              {pizzaId}
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}

function Metric({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border border-border p-4">
      <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      {children}
    </div>
  )
}
