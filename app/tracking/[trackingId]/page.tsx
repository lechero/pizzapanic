import { notFound } from "next/navigation"

import {
  TrackingOrderView,
  type TrackingOrderViewOrder,
} from "@/app/tracking/[trackingId]/_components/tracking-order-view"
import { getOrderByTrackingId } from "@/db/orders"
import { getPizzaById } from "@/lib/pizzas"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type TrackingPageProps = {
  params: Promise<{
    trackingId: string
  }>
}

export default async function TrackingPage({ params }: TrackingPageProps) {
  const { trackingId } = await params
  const order = await getOrderByTrackingId(trackingId)

  if (!order) {
    notFound()
  }

  const trackingOrder: TrackingOrderViewOrder = {
    trackingId: order.trackingId,
    status: order.status,
    panic: order.panic,
    customerName: order.customerName,
    customerAddress: order.customerAddress,
    courierId: order.courierId,
    pizzas: order.order.map((pizzaId) => ({
      id: pizzaId,
      name: getPizzaById(pizzaId)?.name ?? pizzaId,
    })),
  }

  return <TrackingOrderView order={trackingOrder} />
}
