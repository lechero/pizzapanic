import { notFound } from "next/navigation"

import {
  CourierBoard,
  type CourierBoardOrder,
} from "@/app/courier/[publicId]/_components/courier-board"
import { getTransitOrderForCourier, listCookedOrders } from "@/db/orders"
import type { Order } from "@/db/schema"
import { getCourierByPublicId } from "@/lib/kitchen"
import { getOrderTimeoutMs } from "@/lib/order-timeouts"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type CourierDetailPageProps = {
  params: Promise<{
    publicId: string
  }>
}

export default async function CourierDetailPage({
  params,
}: CourierDetailPageProps) {
  const { publicId } = await params
  const courier = getCourierByPublicId(publicId)

  if (!courier) {
    notFound()
  }

  const activeOrder = await getTransitOrderForCourier(courier.id)
  const cookedOrders = activeOrder ? [] : await listCookedOrders()

  return (
    <CourierBoard
      courier={{
        publicId: courier.publicId,
        name: courier.name,
      }}
      activeOrder={activeOrder ? toCourierBoardOrder(activeOrder) : null}
      cookedOrders={cookedOrders.map(toCourierBoardOrder)}
    />
  )
}

function toCourierBoardOrder(order: Order): CourierBoardOrder {
  return {
    id: order.id,
    trackingId: order.trackingId,
    customerName: order.customerName,
    customerAddress: order.customerAddress,
    pizzaCount: order.order.length,
    panic: order.panic,
    statusStartedAt: order.statusStartedAt,
    timeoutMs: getOrderTimeoutMs(order),
  }
}
