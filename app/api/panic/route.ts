import { createOrder } from "@/db/orders"
import { couriers } from "@/lib/kitchen"
import type { OrderStatus } from "@/lib/order-statuses"
import { pizzas } from "@/lib/pizzas"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const minOrders = 5
const maxOrders = 20
const minPizzasPerOrder = 1
const maxPizzasPerOrder = 4
const panicStatuses = [
  "received",
  "cooking",
  "cooked",
  "transit",
] as const satisfies readonly OrderStatus[]

const customerNames = [
  "Alex Arcade",
  "Blair Blitz",
  "Casey Combo",
  "Devon Dash",
  "Emery Extra",
  "Finley Flash",
  "Gray Grid",
  "Harper Hurry",
] as const

const customerStreets = [
  "Basil Byte Boulevard",
  "Crust Control Court",
  "Mozzarella Mile",
  "Oregano Orbit",
  "Pepperoni Parkway",
  "Sauce Signal Street",
  "Topping Tunnel",
  "Yeast Yard",
] as const

type PanicOrderSummary = {
  id: string
  trackingId: string
  status: OrderStatus
}

export async function POST() {
  try {
    const count = randomInteger(minOrders, maxOrders)
    const createdOrders = await Promise.all(
      Array.from({ length: count }, () => createOrder(makePanicOrderInput()))
    )
    const orders: PanicOrderSummary[] = createdOrders.map((order) => ({
      id: order.id,
      trackingId: order.trackingId,
      status: order.status,
    }))

    return Response.json({ count: orders.length, orders }, { status: 201 })
  } catch (error) {
    console.error("Unable to generate panic orders.", error)

    return Response.json(
      { error: "Unable to generate panic orders." },
      { status: 500 }
    )
  }
}

function makePanicOrderInput() {
  const status = randomItem(panicStatuses)

  return {
    status,
    order: makePizzaOrder(),
    customerName: randomItem(customerNames),
    customerAddress: `${randomInteger(10, 999)} ${randomItem(customerStreets)}`,
    courierId: status === "transit" ? randomItem(couriers).id : null,
  }
}

function makePizzaOrder() {
  return Array.from(
    { length: randomInteger(minPizzasPerOrder, maxPizzasPerOrder) },
    () => randomItem(pizzas).id
  )
}

function randomInteger(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomItem<T>(items: readonly T[]) {
  return items[randomInteger(0, items.length - 1)]
}
