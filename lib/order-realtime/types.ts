import type { Order } from "@/db/schema"

export type OrderMutationOperation = "created" | "updated" | "deleted"

export type OrderMutationEvent = {
  operation: OrderMutationOperation
  before: Order | null
  after: Order | null
  changedAt: number
}

export type OrderRealtimeScope =
  | {
      scope: "kitchen"
    }
  | {
      scope: "courier"
      publicId: string
    }
  | {
      scope: "tracking"
      trackingId: string
    }

export type OrderChangedEvent = {
  type: "order.changed"
  scope: "kitchen" | "tracking"
  operation: OrderMutationOperation
  orderId: string
  trackingId: string
  changedAt: number
}

export type CourierBoardChangedEvent = {
  type: "courier-board.changed"
  scope: "courier"
  publicId: string
  operation: OrderMutationOperation
  orderId: string
  changedAt: number
}

export type OrderRealtimeEvent = OrderChangedEvent | CourierBoardChangedEvent

export function getEventOrder(event: OrderMutationEvent) {
  return event.after ?? event.before
}

export function mutationMatchesTracking(
  event: OrderMutationEvent,
  trackingId: string
) {
  return (
    event.before?.trackingId === trackingId ||
    event.after?.trackingId === trackingId
  )
}

export function mutationAffectsCourier(
  event: OrderMutationEvent,
  courierId: string
) {
  return (
    orderAffectsCourier(event.before, courierId) ||
    orderAffectsCourier(event.after, courierId)
  )
}

function orderAffectsCourier(order: Order | null, courierId: string) {
  if (!order) {
    return false
  }

  if (order.status === "cooked") {
    return true
  }

  return order.status === "transit" && order.courierId === courierId
}
