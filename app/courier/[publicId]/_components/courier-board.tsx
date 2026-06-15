"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Bike,
  CheckCircle2,
  MapPin,
  PackageCheck,
  ReceiptText,
  User,
} from "lucide-react"

import {
  updateCourierOrderAction,
  type CourierOrderActionState,
} from "@/app/courier/[publicId]/actions"
import {
  OrderStatusBadge,
  PanicBadge,
} from "@/app/orders/_components/order-status-badge"
import { OrderTimerBadge } from "@/app/orders/_components/order-timer-badge"
import { Button } from "@/components/ui/button"
import { useOrderRealtimeRefresh } from "@/lib/order-realtime/use-order-realtime-refresh"
import { cn } from "@/lib/utils"

type CourierBoardCourier = {
  publicId: string
  name: string
}

export type CourierBoardOrder = {
  id: string
  trackingId: string
  customerName: string
  customerAddress: string
  pizzaCount: number
  panic: boolean
  statusStartedAt: number | null
  timeoutMs: number | null
}

type CourierBoardProps = {
  courier: CourierBoardCourier
  activeOrder: CourierBoardOrder | null
  cookedOrders: CourierBoardOrder[]
}

const initialState: CourierOrderActionState = {
  ok: false,
  message: "",
}

export function CourierBoard({
  courier,
  activeOrder,
  cookedOrders,
}: CourierBoardProps) {
  useOrderRealtimeRefresh({ scope: "courier", publicId: courier.publicId })

  const [state, formAction, pending] = React.useActionState(
    updateCourierOrderAction,
    initialState
  )

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <Button asChild variant="ghost" size="xs" className="mb-3 -ml-3">
            <Link href="/courier">
              <ArrowLeft />
              Couriers
            </Link>
          </Button>
          <p className="font-mono text-xs text-muted-foreground uppercase">
            {courier.publicId}
          </p>
          <h1 className="mt-2 truncate text-2xl font-semibold">
            {courier.name}
          </h1>
        </div>
        <div className="inline-flex w-fit items-center gap-2 border border-border px-3 py-2 font-mono text-xs text-muted-foreground">
          <Bike className="size-4" />
          {activeOrder ? "In transit" : "Available"}
        </div>
      </header>

      {state.message ? <ActionMessage state={state} /> : null}

      {activeOrder ? (
        <ActiveDelivery
          courier={courier}
          order={activeOrder}
          formAction={formAction}
          pending={pending}
        />
      ) : (
        <AvailableOrders
          courier={courier}
          orders={cookedOrders}
          formAction={formAction}
          pending={pending}
        />
      )}
    </main>
  )
}

function ActionMessage({ state }: { state: CourierOrderActionState }) {
  return (
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
  )
}

function ActiveDelivery({
  courier,
  order,
  formAction,
  pending,
}: {
  courier: CourierBoardCourier
  order: CourierBoardOrder
  formAction: (payload: FormData) => void
  pending: boolean
}) {
  return (
    <section className="grid gap-4">
      <div className="flex flex-col gap-3 border border-border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Active delivery</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Complete this delivery before picking up another order.
          </p>
        </div>
        <OrderStatusBadge status="transit" />
      </div>

      <OrderPanel order={order}>
        <form action={formAction}>
          <input type="hidden" name="publicId" value={courier.publicId} />
          <input type="hidden" name="orderId" value={order.id} />
          <input type="hidden" name="intent" value="deliver" />
          <Button type="submit" disabled={pending}>
            <CheckCircle2 />
            {pending ? "Delivering" : "Mark delivered"}
          </Button>
        </form>
      </OrderPanel>
    </section>
  )
}

function AvailableOrders({
  courier,
  orders,
  formAction,
  pending,
}: {
  courier: CourierBoardCourier
  orders: CourierBoardOrder[]
  formAction: (payload: FormData) => void
  pending: boolean
}) {
  return (
    <section className="grid gap-4">
      <div className="flex flex-col gap-3 border border-border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Cooked orders</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick up one cooked order to start transport.
          </p>
        </div>
        <div className="font-mono text-xs text-muted-foreground">
          {orders.length} ready
        </div>
      </div>

      {orders.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {orders.map((order) => (
            <OrderPanel key={order.id} order={order}>
              <form action={formAction}>
                <input type="hidden" name="publicId" value={courier.publicId} />
                <input type="hidden" name="orderId" value={order.id} />
                <input type="hidden" name="intent" value="pickup" />
                <Button type="submit" disabled={pending}>
                  <PackageCheck />
                  {pending ? "Picking up" : "Pick up"}
                </Button>
              </form>
            </OrderPanel>
          ))}
        </div>
      ) : (
        <div className="grid min-h-48 place-items-center border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
          No cooked orders are ready for pickup.
        </div>
      )}
    </section>
  )
}

function OrderPanel({
  order,
  children,
}: {
  order: CourierBoardOrder
  children: React.ReactNode
}) {
  return (
    <article
      className={cn(
        "border bg-card text-card-foreground",
        order.panic
          ? "border-destructive/40 shadow-[inset_3px_0_0_var(--destructive)]"
          : "border-border"
      )}
    >
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-semibold">
              {order.trackingId}
            </span>
            <PanicBadge panic={order.panic} />
            <OrderTimerBadge
              panic={order.panic}
              startedAt={order.statusStartedAt}
              timeoutMs={order.timeoutMs}
            />
          </div>
          <h3 className="mt-2 truncate text-lg font-semibold">
            {order.customerName || "unknown"}
          </h3>
        </div>
        {children}
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-3">
        <OrderFact icon={<User />} label="Customer">
          {order.customerName || "unknown"}
        </OrderFact>
        <OrderFact icon={<MapPin />} label="Address">
          {order.customerAddress || "no address"}
        </OrderFact>
        <OrderFact icon={<ReceiptText />} label="Pizzas">
          <span className="font-mono">{order.pizzaCount}</span>
        </OrderFact>
      </div>
    </article>
  )
}

function OrderFact({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="min-w-0 border border-border bg-background px-3 py-2">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase">
        {icon}
        {label}
      </div>
      <div className="truncate text-sm">{children}</div>
    </div>
  )
}
