import "server-only"

import type { OrderMutationEvent } from "@/lib/order-realtime/types"

type OrderMutationListener = (event: OrderMutationEvent) => void

type OrderEventBus = {
  listeners: Set<OrderMutationListener>
}

const globalForOrderEvents = globalThis as typeof globalThis & {
  __pizzaPanicOrderEventBus?: OrderEventBus
}

function getOrderEventBus() {
  globalForOrderEvents.__pizzaPanicOrderEventBus ??= {
    listeners: new Set<OrderMutationListener>(),
  }

  return globalForOrderEvents.__pizzaPanicOrderEventBus
}

export function publishOrderMutation(event: OrderMutationEvent) {
  for (const listener of Array.from(getOrderEventBus().listeners)) {
    try {
      listener(event)
    } catch (error) {
      console.error("Unable to publish order realtime event.", error)
    }
  }
}

export function subscribeToOrderMutations(listener: OrderMutationListener) {
  const bus = getOrderEventBus()

  bus.listeners.add(listener)

  return () => {
    bus.listeners.delete(listener)
  }
}
