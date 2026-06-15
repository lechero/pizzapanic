import type { NextRequest } from "next/server"

import { retainOrderPanicTicker } from "@/db/order-panic-ticker"
import { getOrderByTrackingId } from "@/db/orders"
import { getCourierByPublicId } from "@/lib/kitchen"
import { subscribeToOrderMutations } from "@/lib/order-realtime/server"
import {
  getEventOrder,
  mutationAffectsCourier,
  mutationMatchesTracking,
  type CourierBoardChangedEvent,
  type OrderChangedEvent,
  type OrderMutationEvent,
  type OrderRealtimeEvent,
} from "@/lib/order-realtime/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const scope = searchParams.get("scope")

  if (scope === "kitchen") {
    return createOrderEventStream((event) => toKitchenEvent(event))
  }

  if (scope === "tracking") {
    const trackingId = searchParams.get("trackingId")?.trim()

    if (!trackingId) {
      return new Response("trackingId is required.", { status: 400 })
    }

    const order = await getOrderByTrackingId(trackingId)

    if (!order) {
      return new Response("Order not found.", { status: 404 })
    }

    return createOrderEventStream((event) =>
      mutationMatchesTracking(event, trackingId)
        ? toTrackingEvent(event, trackingId)
        : null
    )
  }

  if (scope === "courier") {
    const publicId = searchParams.get("publicId")?.trim()

    if (!publicId) {
      return new Response("publicId is required.", { status: 400 })
    }

    const courier = getCourierByPublicId(publicId)

    if (!courier) {
      return new Response("Courier not found.", { status: 404 })
    }

    return createOrderEventStream((event) =>
      mutationAffectsCourier(event, courier.id)
        ? toCourierEvent(event, publicId)
        : null
    )
  }

  return new Response("Unknown order event scope.", { status: 400 })
}

function createOrderEventStream(
  selectEvent: (event: OrderMutationEvent) => OrderRealtimeEvent | null
) {
  const encoder = new TextEncoder()
  let closed = false
  let releaseTicker: (() => void) | undefined
  let unsubscribe: (() => void) | undefined
  let heartbeat: ReturnType<typeof setInterval> | undefined

  const stream = new ReadableStream({
    start(controller) {
      function enqueue(chunk: string) {
        if (closed) {
          return
        }

        try {
          controller.enqueue(encoder.encode(chunk))
        } catch {
          close()
        }
      }

      function close() {
        if (closed) {
          return
        }

        closed = true
        releaseTicker?.()
        unsubscribe?.()

        if (heartbeat) {
          clearInterval(heartbeat)
        }

        try {
          controller.close()
        } catch {
          // Stream is already closed.
        }
      }

      enqueue(": connected\n\n")
      releaseTicker = retainOrderPanicTicker()

      unsubscribe = subscribeToOrderMutations((mutation) => {
        const event = selectEvent(mutation)

        if (!event) {
          return
        }

        enqueue(`data: ${JSON.stringify(event)}\n\n`)
      })

      heartbeat = setInterval(() => {
        enqueue(": heartbeat\n\n")
      }, 20_000)
    },
    cancel() {
      closed = true
      releaseTicker?.()
      unsubscribe?.()

      if (heartbeat) {
        clearInterval(heartbeat)
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}

function toKitchenEvent(event: OrderMutationEvent): OrderChangedEvent | null {
  const order = getEventOrder(event)

  if (!order) {
    return null
  }

  return {
    type: "order.changed",
    scope: "kitchen",
    operation: event.operation,
    orderId: order.id,
    trackingId: order.trackingId,
    changedAt: event.changedAt,
  }
}

function toTrackingEvent(
  event: OrderMutationEvent,
  trackingId: string
): OrderChangedEvent | null {
  const order = getEventOrder(event)

  if (!order) {
    return null
  }

  return {
    type: "order.changed",
    scope: "tracking",
    operation: event.operation,
    orderId: order.id,
    trackingId,
    changedAt: event.changedAt,
  }
}

function toCourierEvent(
  event: OrderMutationEvent,
  publicId: string
): CourierBoardChangedEvent | null {
  const order = getEventOrder(event)

  if (!order) {
    return null
  }

  return {
    type: "courier-board.changed",
    scope: "courier",
    publicId,
    operation: event.operation,
    orderId: order.id,
    changedAt: event.changedAt,
  }
}
