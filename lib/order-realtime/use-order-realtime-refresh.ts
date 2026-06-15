"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import type {
  OrderRealtimeEvent,
  OrderRealtimeScope,
} from "@/lib/order-realtime/types"

export function useOrderRealtimeRefresh(scope: OrderRealtimeScope) {
  const router = useRouter()
  const scopeName = scope.scope
  const publicId = scope.scope === "courier" ? scope.publicId : ""
  const trackingId = scope.scope === "tracking" ? scope.trackingId : ""
  const url = getOrderEventsUrl(scopeName, publicId, trackingId)

  React.useEffect(() => {
    let frame = 0
    const events = new EventSource(url)

    function refreshSoon() {
      if (frame) {
        return
      }

      frame = window.requestAnimationFrame(() => {
        frame = 0
        React.startTransition(() => {
          router.refresh()
        })
      })
    }

    events.onmessage = (message) => {
      const event = parseOrderEvent(message.data)

      if (
        !event ||
        !eventMatchesScope(event, scopeName, publicId, trackingId)
      ) {
        return
      }

      refreshSoon()
    }

    events.onerror = () => {
      if (events.readyState === EventSource.CLOSED) {
        refreshSoon()
      }
    }

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame)
      }

      events.close()
    }
  }, [router, scopeName, publicId, trackingId, url])
}

function getOrderEventsUrl(
  scope: OrderRealtimeScope["scope"],
  publicId: string,
  trackingId: string
) {
  const params = new URLSearchParams({ scope })

  if (scope === "courier") {
    params.set("publicId", publicId)
  }

  if (scope === "tracking") {
    params.set("trackingId", trackingId)
  }

  return `/api/orders/events?${params.toString()}`
}

function parseOrderEvent(data: string): OrderRealtimeEvent | null {
  try {
    const event = JSON.parse(data) as Partial<OrderRealtimeEvent>

    return event.type === "order.changed" ||
      event.type === "courier-board.changed"
      ? (event as OrderRealtimeEvent)
      : null
  } catch {
    return null
  }
}

function eventMatchesScope(
  event: OrderRealtimeEvent,
  scope: OrderRealtimeScope["scope"],
  publicId: string,
  trackingId: string
) {
  if (scope === "kitchen") {
    return event.type === "order.changed" && event.scope === "kitchen"
  }

  if (scope === "courier") {
    return (
      event.type === "courier-board.changed" &&
      event.scope === "courier" &&
      event.publicId === publicId
    )
  }

  return (
    event.type === "order.changed" &&
    event.scope === "tracking" &&
    event.trackingId === trackingId
  )
}
