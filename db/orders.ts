import { randomUUID } from "node:crypto"

import { asc, desc, eq, like, or } from "drizzle-orm"

import { getDb } from "@/db"
import { orders, type NewOrder, type Order } from "@/db/schema"
import type { OrderStatus } from "@/lib/order-statuses"

export const orderSorts = ["trackingId", "status", "panic", "courierId"] as const
export const orderDirections = ["asc", "desc"] as const

export type OrderSort = (typeof orderSorts)[number]
export type OrderDirection = (typeof orderDirections)[number]

export type OrderInput = {
  trackingId?: string
  status?: OrderStatus
  panic?: boolean
  order: string[]
  courierId?: string | null
}

export type OrderUpdateInput = Partial<Omit<OrderInput, "trackingId">>

const orderSortColumns = {
  trackingId: orders.trackingId,
  status: orders.status,
  panic: orders.panic,
  courierId: orders.courierId,
} satisfies Record<OrderSort, typeof orders.trackingId | typeof orders.status | typeof orders.panic | typeof orders.courierId>

export function normalizeOrderSort(value: unknown): OrderSort {
  return typeof value === "string" && orderSorts.includes(value as OrderSort)
    ? (value as OrderSort)
    : "trackingId"
}

export function normalizeOrderDirection(value: unknown): OrderDirection {
  return value === "desc" ? "desc" : "asc"
}

export async function listOrders(input: {
  query?: string
  sort?: OrderSort
  direction?: OrderDirection
} = {}): Promise<Order[]> {
  const query = input.query?.trim()
  const sort = input.sort ?? "trackingId"
  const direction = input.direction ?? "asc"
  const sortColumn = orderSortColumns[sort]
  const orderBy = direction === "desc" ? desc(sortColumn) : asc(sortColumn)
  const db = getDb()
  const statement = db.select().from(orders).$dynamic()

  if (query) {
    const pattern = `%${query}%`

    statement.where(
      or(
        like(orders.trackingId, pattern),
        like(orders.status, pattern),
        like(orders.courierId, pattern),
        like(orders.order, pattern)
      )
    )
  }

  return statement.orderBy(orderBy)
}

export async function getOrderById(id: string) {
  const [order] = await getDb().select().from(orders).where(eq(orders.id, id)).limit(1)
  return order ?? null
}

export async function getOrderByTrackingId(trackingId: string) {
  const [order] = await getDb()
    .select()
    .from(orders)
    .where(eq(orders.trackingId, trackingId))
    .limit(1)

  return order ?? null
}

export async function createOrder(input: OrderInput) {
  const [createdOrder] = await getDb()
    .insert(orders)
    .values(toNewOrder(input))
    .returning()

  return createdOrder
}

export async function updateOrder(id: string, input: OrderUpdateInput) {
  const [updatedOrder] = await getDb()
    .update(orders)
    .set(input)
    .where(eq(orders.id, id))
    .returning()

  return updatedOrder ?? null
}

export async function deleteOrder(id: string) {
  const [deletedOrder] = await getDb().delete(orders).where(eq(orders.id, id)).returning()
  return deletedOrder ?? null
}

export function makeTrackingId() {
  return `trk_${randomUUID().replaceAll("-", "").slice(0, 12)}`
}

function toNewOrder(input: OrderInput): NewOrder {
  return {
    id: randomUUID(),
    trackingId: input.trackingId?.trim() || makeTrackingId(),
    status: input.status ?? "received",
    panic: input.panic ?? false,
    order: input.order,
    courierId: input.courierId?.trim() || null,
  }
}
