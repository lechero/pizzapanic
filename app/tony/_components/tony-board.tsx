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
  const activeOrders = orders.filter((order) => !order.panic)
  const ordersByStatus = React.useMemo(
    () => groupOrdersByStatus(activeOrders),
    [activeOrders]
  )
  const panicOrders = orders.filter((order) => order.panic)
  const cookingCount = orders.filter(
    (order) => order.status === "cooking"
  ).length
  const transitCount = orders.filter(
    (order) => order.status === "transit"
  ).length

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
        "overflow-hidden border bg-background",
        order.panic
          ? "border-destructive/40 shadow-[inset_3px_0_0_var(--destructive)]"
          : "border-border"
      )}
    >
      <OrderControlCard
        order={order}
        formAction={formAction}
        pending={pending}
      />
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
    <article className="overflow-hidden border border-destructive/30 bg-background">
      <OrderControlCard
        order={order}
        formAction={formAction}
        pending={pending}
        showStatus
      />
    </article>
  )
}

function OrderControlCard({
  order,
  formAction,
  pending,
  showStatus = false,
}: {
  order: Order
  formAction: (payload: FormData) => void
  pending: boolean
  showStatus?: boolean
}) {
  const canMovePrev = order.status !== "received"
  const canMoveNext = order.status !== "delivered"

  return (
    <table className="w-full table-fixed border-collapse">
      <tbody>
        <tr>
          <td className="w-10 border-r border-border align-middle">
            {canMovePrev ? (
              <OrderActionButton
                orderId={order.id}
                intent="prev"
                label="Move order to previous status"
                formAction={formAction}
                pending={pending}
              />
            ) : (
              <span aria-hidden="true" className="block size-10" />
            )}
          </td>
          <td className="min-w-0 px-3 py-3 align-top">
            <OrderSummary order={order} showStatus={showStatus} />
          </td>
          <td className="w-10 border-l border-border align-middle">
            {canMoveNext ? (
              <OrderActionButton
                orderId={order.id}
                intent="next"
                label="Move order to next status"
                formAction={formAction}
                pending={pending}
              />
            ) : (
              <span aria-hidden="true" className="block size-10" />
            )}
          </td>
        </tr>
        <tr>
          <td colSpan={3} className="border-t border-border">
            <OrderActionButton
              orderId={order.id}
              intent="panic"
              label="Mark order as panic"
              formAction={formAction}
              pending={pending}
              wide
            />
          </td>
        </tr>
      </tbody>
    </table>
  )
}

function OrderSummary({
  order,
  showStatus = false,
}: {
  order: Order
  showStatus?: boolean
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2">
        <span className="truncate font-mono text-xs font-semibold">
          {order.trackingId}
        </span>
        <PanicBadge panic={order.panic} />
        {showStatus ? <OrderStatusBadge status={order.status} /> : null}
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
      {showStatus ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <span className="font-mono text-[11px] text-muted-foreground uppercase">
            Panicked from
          </span>
          <OrderStatusBadge status={order.panicFromStatus ?? order.status} />
        </div>
      ) : null}
    </div>
  )
}

function OrderActionButton({
  orderId,
  intent,
  label,
  formAction,
  pending,
  wide = false,
}: {
  orderId: string
  intent: "prev" | "panic" | "next"
  label: string
  formAction: (payload: FormData) => void
  pending: boolean
  wide?: boolean
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
        size={wide ? "sm" : "icon-sm"}
        disabled={pending}
        className={cn("rounded-none border-0", wide ? "h-9 w-full" : "size-10")}
      >
        {icon}
        <span className="sr-only">{label}</span>
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
