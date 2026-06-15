"use client"

import Link from "next/link"
import { ArrowLeft, Bike, MapPin, ReceiptText, User } from "lucide-react"

import {
  OrderStatusBadge,
  PanicBadge,
} from "@/app/orders/_components/order-status-badge"
import { Button } from "@/components/ui/button"
import type { OrderStatus } from "@/db/schema"
import { useOrderRealtimeRefresh } from "@/lib/order-realtime/use-order-realtime-refresh"

export type TrackingOrderViewOrder = {
  trackingId: string
  status: OrderStatus
  panic: boolean
  customerName: string
  customerAddress: string
  courierId: string | null
  pizzas: {
    id: string
    name: string
  }[]
}

export function TrackingOrderView({ order }: { order: TrackingOrderViewOrder }) {
  useOrderRealtimeRefresh({
    scope: "tracking",
    trackingId: order.trackingId,
  })

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 border-b border-border pb-5">
        <Button asChild variant="ghost" size="xs" className="-ml-3 w-fit">
          <Link href="/menu">
            <ArrowLeft />
            Menu
          </Link>
        </Button>
        <div className="min-w-0">
          <p className="font-mono text-xs text-muted-foreground uppercase">
            Tracking
          </p>
          <h1 className="mt-2 truncate font-mono text-2xl font-semibold">
            {order.trackingId}
          </h1>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="Status">
          <OrderStatusBadge status={order.status} />
        </Metric>
        <Metric label="Panic">
          <PanicBadge panic={order.panic} />
        </Metric>
        <Metric label="Pizzas">
          <span className="font-mono text-sm">{order.pizzas.length}</span>
        </Metric>
        <Metric label="Courier">
          <span className="font-mono text-sm">
            {order.courierId ?? "unassigned"}
          </span>
        </Metric>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <InfoBlock
          icon={<User />}
          label="Name"
          value={order.customerName || "unknown"}
        />
        <InfoBlock
          icon={<MapPin />}
          label="Address"
          value={order.customerAddress || "no address"}
        />
      </section>

      <section className="border border-border">
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <ReceiptText className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-muted-foreground uppercase">
            Order
          </h2>
        </div>
        <div className="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-3">
          {order.pizzas.map((pizza, index) => (
            <div
              key={`${pizza.id}-${index}`}
              className="border border-border bg-muted/30 px-3 py-2 text-sm"
            >
              <div className="truncate font-medium">{pizza.name}</div>
              <div className="mt-1 font-mono text-xs text-muted-foreground">
                {pizza.id}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="flex items-center gap-3 border border-border p-4 text-sm text-muted-foreground">
        <Bike className="size-4 shrink-0" />
        <span className="min-w-0 truncate">
          {order.courierId ? `Courier ${order.courierId}` : "Courier pending"}
        </span>
      </section>
    </main>
  )
}

function Metric({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="border border-border p-4">
      <div className="mb-3 text-xs font-semibold text-muted-foreground uppercase">
        {label}
      </div>
      {children}
    </div>
  )
}

function InfoBlock({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3 border border-border p-4">
      <div className="grid size-9 shrink-0 place-items-center border border-border text-muted-foreground">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs font-semibold text-muted-foreground uppercase">
          {label}
        </div>
        <div className="mt-1 break-words text-sm">{value}</div>
      </div>
    </div>
  )
}
