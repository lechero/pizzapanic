import type { Order } from "@/db/schema"
import type { OrderStatus } from "@/lib/order-statuses"
import { getPizzaById } from "@/lib/pizzas"

export const maxTimeouts = {
  received: 45_000,
  cooking: 45_000,
  cooked: 60_000,
  transit: 110_000,
} as const satisfies Partial<Record<OrderStatus, number>>

export type TimedOrderStatus = keyof typeof maxTimeouts

export const timedOrderStatuses = Object.keys(maxTimeouts) as TimedOrderStatus[]

export type OrderTimerSnapshot = {
  status: TimedOrderStatus
  startedAt: number
  timeoutMs: number
  elapsedMs: number
  remainingMs: number
  expired: boolean
}

export type OrderTimerInput = Pick<
  Order,
  "order" | "panic" | "status" | "statusStartedAt"
>

export function isTimedOrderStatus(
  status: OrderStatus
): status is TimedOrderStatus {
  return status in maxTimeouts
}

export function getOrderTimeoutMs(order: Pick<Order, "order" | "status">) {
  if (!isTimedOrderStatus(order.status)) {
    return null
  }

  const baseTimeout = maxTimeouts[order.status]

  if (order.status !== "cooking") {
    return baseTimeout
  }

  const firstPizzaId = order.order[0]
  const firstPizza = firstPizzaId ? getPizzaById(firstPizzaId) : null
  const firstPizzaBounceMs = firstPizza ? firstPizza.panicTime * 1_000 : 0

  return baseTimeout + firstPizzaBounceMs
}

export function getOrderTimerSnapshot(
  order: OrderTimerInput,
  now = Date.now()
): OrderTimerSnapshot | null {
  if (order.panic || !order.statusStartedAt) {
    return null
  }

  if (!isTimedOrderStatus(order.status)) {
    return null
  }

  const timeoutMs = getOrderTimeoutMs(order)

  if (!timeoutMs) {
    return null
  }

  const elapsedMs = Math.max(0, now - order.statusStartedAt)
  const remainingMs = timeoutMs - elapsedMs

  return {
    status: order.status,
    startedAt: order.statusStartedAt,
    timeoutMs,
    elapsedMs,
    remainingMs,
    expired: remainingMs <= 0,
  }
}

export function formatTimerDuration(durationMs: number) {
  const absoluteMs = Math.max(0, Math.abs(durationMs))
  const totalSeconds = Math.ceil(absoluteMs / 1_000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  if (minutes === 0) {
    return `${seconds}s`
  }

  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}
