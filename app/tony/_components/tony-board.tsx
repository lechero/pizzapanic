"use client"

import * as React from "react"
import { Flame, MoveLeft, MoveRight, Siren } from "lucide-react"

import {
  updateTonyOrderAction,
  type TonyOrderActionState,
} from "@/app/tony/actions"
import {
  OrderStatusBadge,
  PanicBadge,
} from "@/app/orders/_components/order-status-badge"
import { Button } from "@/components/ui/button"
import type { Order } from "@/db/schema"
import { couriers, ovens } from "@/lib/kitchen"
import { orderStatuses, type OrderStatus } from "@/lib/order-statuses"
import { cn } from "@/lib/utils"

type TonyBoardProps = {
  orders: Order[]
}

const initialState: TonyOrderActionState = {
  ok: false,
  message: "",
}

export function TonyBoard({ orders }: TonyBoardProps) {
  const [state, formAction, pending] = React.useActionState(
    updateTonyOrderAction,
    initialState
  )
  const ordersByStatus = React.useMemo(
    () => groupOrdersByStatus(orders),
    [orders]
  )
  const panicOrders = orders.filter((order) => order.panic)
  const cookingCount = ordersByStatus.cooking.length
  const transitCount = ordersByStatus.transit.length

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 border border-border bg-muted/20 p-4 sm:grid-cols-2">
        <CapacityMetric
          icon={<Flame />}
          label="Magic ovens"
          value={`${cookingCount}/${ovens}`}
        />
        <CapacityMetric
          icon={<MoveRight />}
          label="Couriers"
          value={`${transitCount}/${couriers.length}`}
        />
      </div>

      {state.message ? (
        <p
          className={cn(
            "border px-3 py-2 text-sm",
            state.ok
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "border-destructive/30 bg-destructive/10 text-destructive"
          )}
        >
          {state.message}
        </p>
      ) : null}

      <div className="overflow-x-auto border border-border">
        <table className="w-full min-w-[1120px] border-collapse text-sm">
          <tbody>
            <tr className="align-top">
              {orderStatuses.map((status) => (
                <td
                  key={status}
                  className="w-1/5 border-r border-border last:border-r-0"
                >
                  <section className="flex min-h-[32rem] flex-col">
                    <div className="sticky top-0 z-10 border-b border-border bg-muted px-3 py-3">
                      <div className="flex items-center justify-between gap-2">
                        <OrderStatusBadge status={status} />
                        <span className="font-mono text-xs text-muted-foreground">
                          {ordersByStatus[status].length}
                        </span>
                      </div>
                    </div>

                    <div className="grid flex-1 content-start gap-3 p-3">
                      {ordersByStatus[status].length > 0 ? (
                        ordersByStatus[status].map((order) => (
                          <OrderCard
                            key={order.id}
                            order={order}
                            formAction={formAction}
                            pending={pending}
                          />
                        ))
                      ) : (
                        <div className="grid min-h-24 place-items-center border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
                          No orders
                        </div>
                      )}
                    </div>
                  </section>
                </td>
              ))}
            </tr>
            <tr>
              <td
                colSpan={5}
                className="border-t border-border bg-destructive/5 p-0"
              >
                <section>
                  <div className="flex items-center justify-between gap-3 border-b border-destructive/20 px-4 py-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-destructive uppercase">
                      <Siren className="size-4" />
                      Panic State
                    </div>
                    <span className="font-mono text-xs text-muted-foreground">
                      {panicOrders.length}
                    </span>
                  </div>

                  <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {panicOrders.length > 0 ? (
                      panicOrders.map((order) => (
                        <PanicOrder
                          key={order.id}
                          order={order}
                          formAction={formAction}
                          pending={pending}
                        />
                      ))
                    ) : (
                      <div className="border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground sm:col-span-2 lg:col-span-3 xl:col-span-4">
                        No panicked orders.
                      </div>
                    )}
                  </div>
                </section>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

function OrderCard({
  order,
  formAction,
  pending,
}: {
  order: Order
  formAction: (payload: FormData) => void
  pending: boolean
}) {
  return (
    <article
      className={cn(
        "grid gap-3 border bg-background p-3",
        order.panic
          ? "border-destructive/40 shadow-[inset_3px_0_0_var(--destructive)]"
          : "border-border"
      )}
    >
      <OrderSummary order={order} />
      <OrderActions order={order} formAction={formAction} pending={pending} />
    </article>
  )
}

function PanicOrder({
  order,
  formAction,
  pending,
}: {
  order: Order
  formAction: (payload: FormData) => void
  pending: boolean
}) {
  return (
    <article className="grid gap-3 border border-destructive/30 bg-background p-3">
      <div className="flex items-start justify-between gap-3">
        <OrderSummary order={order} />
        <OrderStatusBadge status={order.status} />
      </div>
      <OrderActions order={order} formAction={formAction} pending={pending} />
    </article>
  )
}

function OrderSummary({ order }: { order: Order }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2">
        <span className="truncate font-mono text-xs font-semibold">
          {order.trackingId}
        </span>
        <PanicBadge panic={order.panic} />
      </div>
      <div className="mt-2 truncate text-sm font-medium">
        {order.customerName || "unknown"}
      </div>
      <div className="mt-1 truncate text-xs text-muted-foreground">
        {order.customerAddress || "no address"}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-[11px] text-muted-foreground">
        <span>{order.order.length} pizzas</span>
        <span>{order.courierId ?? "unassigned"}</span>
      </div>
    </div>
  )
}

function OrderActions({
  order,
  formAction,
  pending,
}: {
  order: Order
  formAction: (payload: FormData) => void
  pending: boolean
}) {
  const canMovePrev = order.status !== "received"
  const canMoveNext = order.status !== "delivered"

  return (
    <div className="flex flex-wrap gap-1.5">
      {canMovePrev ? (
        <OrderActionButton
          orderId={order.id}
          intent="prev"
          formAction={formAction}
          pending={pending}
        />
      ) : null}
      <OrderActionButton
        orderId={order.id}
        intent="panic"
        formAction={formAction}
        pending={pending}
      />
      {canMoveNext ? (
        <OrderActionButton
          orderId={order.id}
          intent="next"
          formAction={formAction}
          pending={pending}
        />
      ) : null}
    </div>
  )
}

function OrderActionButton({
  orderId,
  intent,
  formAction,
  pending,
}: {
  orderId: string
  intent: "prev" | "panic" | "next"
  formAction: (payload: FormData) => void
  pending: boolean
}) {
  const icon =
    intent === "prev" ? (
      <MoveLeft />
    ) : intent === "next" ? (
      <MoveRight />
    ) : (
      <Siren />
    )

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={orderId} />
      <input type="hidden" name="intent" value={intent} />
      <Button
        type="submit"
        variant={intent === "panic" ? "destructive" : "outline"}
        size="xs"
        disabled={pending}
        className="min-w-0"
      >
        {icon}
        {intent}
      </Button>
    </form>
  )
}

function CapacityMetric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
        <span className="grid size-8 shrink-0 place-items-center border border-border text-foreground">
          {icon}
        </span>
        <span className="truncate">{label}</span>
      </div>
      <span className="font-mono text-sm font-semibold">{value}</span>
    </div>
  )
}

function groupOrdersByStatus(orders: Order[]) {
  return orderStatuses.reduce(
    (groups, status) => {
      groups[status] = orders.filter((order) => order.status === status)
      return groups
    },
    {} as Record<OrderStatus, Order[]>
  )
}
