"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowDown, ArrowUp, ArrowUpDown, Eye, Search, Trash2, X } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { deleteOrderAction } from "@/app/orders/actions"
import { OrderEditSheet } from "@/app/orders/_components/order-edit-sheet"
import { OrderStatusBadge, PanicBadge } from "@/app/orders/_components/order-status-badge"
import { Button } from "@/components/ui/button"
import type { OrderDirection, OrderSort } from "@/db/orders"
import type { Order } from "@/db/schema"

type OrderTableProps = {
  orders: Order[]
  query: string
  sort: OrderSort
  direction: OrderDirection
}

const columns: Array<{ key: OrderSort; label: string }> = [
  { key: "trackingId", label: "Tracking" },
  { key: "status", label: "Status" },
  { key: "panic", label: "Panic" },
  { key: "courierId", label: "Courier" },
]

export function OrderTable({ orders, query, sort, direction }: OrderTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const searchInputRef = React.useRef<HTMLInputElement>(null)

  function pushParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString())

    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    }

    const next = params.toString()
    router.push(next ? `${pathname}?${next}` : pathname)
  }

  function onSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    pushParams({ q: searchInputRef.current?.value.trim() || null })
  }

  function onSort(nextSort: OrderSort) {
    const nextDirection = sort === nextSort && direction === "asc" ? "desc" : "asc"
    pushParams({ sort: nextSort, dir: nextDirection })
  }

  return (
    <div className="grid gap-4">
      <form onSubmit={onSearch} className="flex flex-col gap-2 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            key={query}
            ref={searchInputRef}
            defaultValue={query}
            placeholder="Search tracking, status, customer, courier, or pizza id"
            className="h-10 w-full border border-input bg-background pl-9 pr-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" variant="secondary" size="sm">
            Search
          </Button>
          {query ? (
            <Button type="button" variant="outline" size="icon-sm" onClick={() => pushParams({ q: null })}>
              <X />
              <span className="sr-only">Clear search</span>
            </Button>
          ) : null}
        </div>
      </form>

      <div className="overflow-x-auto border border-border">
        <table className="w-full min-w-[840px] border-collapse text-sm">
          <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="border-b px-3 py-2 text-left font-semibold">
                  <button
                    type="button"
                    onClick={() => onSort(column.key)}
                    className="inline-flex h-8 items-center gap-1 text-left"
                  >
                    {column.label}
                    {sort === column.key ? (
                      direction === "asc" ? (
                        <ArrowUp className="size-3" />
                      ) : (
                        <ArrowDown className="size-3" />
                      )
                    ) : (
                      <ArrowUpDown className="size-3 opacity-50" />
                    )}
                  </button>
                </th>
              ))}
              <th className="border-b px-3 py-2 text-left font-semibold">Customer</th>
              <th className="border-b px-3 py-2 text-left font-semibold">Pizza IDs</th>
              <th className="border-b px-3 py-2 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.length > 0 ? (
              orders.map((order) => (
                <tr key={order.id} className="border-b last:border-b-0 hover:bg-muted/40">
                  <td className="px-3 py-3 font-mono text-xs">{order.trackingId}</td>
                  <td className="px-3 py-3">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="px-3 py-3">
                    <PanicBadge panic={order.panic} />
                  </td>
                  <td className="px-3 py-3 font-mono text-xs text-muted-foreground">
                    {order.courierId ?? "unassigned"}
                  </td>
                  <td className="max-w-[220px] px-3 py-3">
                    <div className="truncate font-medium">{order.customerName || "unknown"}</div>
                    <div className="truncate text-xs text-muted-foreground">{order.customerAddress || "no address"}</div>
                  </td>
                  <td className="max-w-[260px] px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      {order.order.map((pizzaId) => (
                        <span key={pizzaId} className="border border-border bg-background px-2 py-1 font-mono text-[11px]">
                          {pizzaId}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex justify-end gap-2">
                      <Button asChild variant="ghost" size="icon-xs">
                        <Link href={`/orders/${order.id}`}>
                          <Eye />
                          <span className="sr-only">View order</span>
                        </Link>
                      </Button>
                      <OrderEditSheet order={order} mode="edit" triggerLabel="Edit" />
                      <form
                        action={deleteOrderAction}
                        onSubmit={(event) => {
                          if (!window.confirm(`Delete ${order.trackingId}?`)) {
                            event.preventDefault()
                          }
                        }}
                      >
                        <input type="hidden" name="id" value={order.id} />
                        <Button type="submit" variant="destructive" size="icon-xs">
                          <Trash2 />
                          <span className="sr-only">Delete order</span>
                        </Button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-3 py-12 text-center text-sm text-muted-foreground">
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
