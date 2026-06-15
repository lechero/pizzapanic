import { randomUUID } from "node:crypto"

import { and, asc, desc, eq, like, or } from "drizzle-orm"

import { getDb } from "@/db"
import { orders, type NewOrder, type Order } from "@/db/schema"
import {
  couriers,
  getCourierById,
  orderUsesOven,
  maxCookingOrders,
  maxTransitOrders,
} from "@/lib/kitchen"
import { getOrderTimeoutMs, isTimedOrderStatus } from "@/lib/order-timeouts"
import { orderStatuses, type OrderStatus } from "@/lib/order-statuses"
import { publishOrderMutation } from "@/lib/order-realtime/server"

export const orderSorts = [
  "trackingId",
  "status",
  "panic",
  "courierId",
] as const
export const orderDirections = ["asc", "desc"] as const

export type OrderSort = (typeof orderSorts)[number]
export type OrderDirection = (typeof orderDirections)[number]

export type OrderInput = {
  trackingId?: string
  status?: OrderStatus
  panic?: boolean
  order: string[]
  customerName?: string
  customerAddress?: string
  courierId?: string | null
}

export type OrderUpdateInput = Partial<Omit<OrderInput, "trackingId">> & {
  cookingStartedAt?: number | null
  statusStartedAt?: number | null
  panicFromStatus?: OrderStatus | null
}

export type OrderMoveDirection = "prev" | "next"

export type OrderMutationResult = {
  ok: boolean
  message: string
  order?: Order
}

const orderSortColumns = {
  trackingId: orders.trackingId,
  status: orders.status,
  panic: orders.panic,
  courierId: orders.courierId,
} satisfies Record<
  OrderSort,
  | typeof orders.trackingId
  | typeof orders.status
  | typeof orders.panic
  | typeof orders.courierId
>

export function normalizeOrderSort(value: unknown): OrderSort {
  return typeof value === "string" && orderSorts.includes(value as OrderSort)
    ? (value as OrderSort)
    : "trackingId"
}

export function normalizeOrderDirection(value: unknown): OrderDirection {
  return value === "desc" ? "desc" : "asc"
}

export async function listOrders(
  input: {
    query?: string
    sort?: OrderSort
    direction?: OrderDirection
  } = {}
): Promise<Order[]> {
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
        like(orders.customerName, pattern),
        like(orders.customerAddress, pattern),
        like(orders.courierId, pattern),
        like(orders.order, pattern)
      )
    )
  }

  return statement.orderBy(orderBy)
}

export async function getOrderById(id: string) {
  const [order] = await getDb()
    .select()
    .from(orders)
    .where(eq(orders.id, id))
    .limit(1)
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

export async function listCookedOrders(): Promise<Order[]> {
  return getDb()
    .select()
    .from(orders)
    .where(eq(orders.status, "cooked"))
    .orderBy(asc(orders.trackingId))
}

export async function getTransitOrderForCourier(courierId: string) {
  const [order] = await getDb()
    .select()
    .from(orders)
    .where(and(eq(orders.status, "transit"), eq(orders.courierId, courierId)))
    .orderBy(asc(orders.trackingId))
    .limit(1)

  return order ?? null
}

export async function pickUpCookedOrder(input: {
  orderId: string
  courierId: string
}): Promise<OrderMutationResult> {
  const courier = getCourierById(input.courierId)

  if (!courier) {
    return {
      ok: false,
      message: "Courier not found.",
    }
  }

  const activeOrder = await getTransitOrderForCourier(courier.id)

  if (activeOrder) {
    return {
      ok: false,
      message: "Deliver the active order before picking up another.",
      order: activeOrder,
    }
  }

  const before = await getOrderById(input.orderId)
  const [updatedOrder] = await getDb()
    .update(orders)
    .set({
      status: "transit",
      courierId: courier.id,
      statusStartedAt: Date.now(),
    })
    .where(and(eq(orders.id, input.orderId), eq(orders.status, "cooked")))
    .returning()

  if (updatedOrder) {
    publishOrderUpdated(before, updatedOrder)
  }

  return {
    ok: Boolean(updatedOrder),
    message: updatedOrder
      ? "Order picked up for delivery."
      : "Only cooked orders can be picked up.",
    order: updatedOrder ?? undefined,
  }
}

export async function deliverCourierOrder(input: {
  orderId: string
  courierId: string
}): Promise<OrderMutationResult> {
  const courier = getCourierById(input.courierId)

  if (!courier) {
    return {
      ok: false,
      message: "Courier not found.",
    }
  }

  const before = await getOrderById(input.orderId)
  const [updatedOrder] = await getDb()
    .update(orders)
    .set({
      status: "delivered",
      statusStartedAt: Date.now(),
    })
    .where(
      and(
        eq(orders.id, input.orderId),
        eq(orders.status, "transit"),
        eq(orders.courierId, courier.id)
      )
    )
    .returning()

  if (updatedOrder) {
    publishOrderUpdated(before, updatedOrder)
  }

  return {
    ok: Boolean(updatedOrder),
    message: updatedOrder
      ? "Order marked as delivered."
      : "No active delivery was found for this courier.",
    order: updatedOrder ?? undefined,
  }
}

export async function createOrder(input: OrderInput) {
  const [createdOrder] = await getDb()
    .insert(orders)
    .values(toNewOrder(input))
    .returning()

  if (createdOrder) {
    publishOrderCreated(createdOrder)
  }

  return createdOrder
}

export async function updateOrder(id: string, input: OrderUpdateInput) {
  const before = await getOrderById(id)
  const update = toOrderUpdate(before, input)
  const [updatedOrder] = await getDb()
    .update(orders)
    .set(update)
    .where(eq(orders.id, id))
    .returning()

  if (updatedOrder) {
    publishOrderUpdated(before, updatedOrder)
  }

  return updatedOrder ?? null
}

export async function deleteOrder(id: string) {
  const [deletedOrder] = await getDb()
    .delete(orders)
    .where(eq(orders.id, id))
    .returning()

  if (deletedOrder) {
    publishOrderDeleted(deletedOrder)
  }

  return deletedOrder ?? null
}

export async function moveOrderStatus(
  id: string,
  direction: OrderMoveDirection
): Promise<OrderMutationResult> {
  const db = getDb()
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, id))
    .limit(1)

  if (!order) {
    return {
      ok: false,
      message: "Order not found.",
    }
  }

  const nextStatus = getAdjacentStatus(order.status, direction)

  if (!nextStatus) {
    return {
      ok: false,
      message:
        direction === "prev"
          ? "Order is already in the first column."
          : "Order is already in the last column.",
    }
  }

  const capacityError = await getCapacityError(order, nextStatus)

  if (capacityError) {
    return {
      ok: false,
      message: capacityError,
    }
  }

  const [updatedOrder] = await db
    .update(orders)
    .set(await getStatusUpdate(order, nextStatus))
    .where(eq(orders.id, id))
    .returning()

  if (updatedOrder) {
    publishOrderUpdated(order, updatedOrder)
  }

  return {
    ok: Boolean(updatedOrder),
    message: updatedOrder
      ? `Order moved to ${nextStatus}.`
      : "Order not found.",
    order: updatedOrder ?? undefined,
  }
}

export async function panicOrder(id: string): Promise<OrderMutationResult> {
  const order = await getOrderById(id)

  if (!order) {
    return {
      ok: false,
      message: "Order not found.",
    }
  }

  const [updatedOrder] = await getDb()
    .update(orders)
    .set({
      panic: true,
      panicFromStatus: order.panicFromStatus ?? order.status,
    })
    .where(eq(orders.id, id))
    .returning()

  if (updatedOrder) {
    publishOrderUpdated(order, updatedOrder)
  }

  return {
    ok: Boolean(updatedOrder),
    message: updatedOrder ? "Order marked as panic." : "Order not found.",
    order: updatedOrder ?? undefined,
  }
}

export async function tickOrderPanicState(now = Date.now()) {
  const db = getDb()
  const pendingOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.panic, false))
  let started = 0
  let panicked = 0

  for (const order of pendingOrders) {
    if (!isTimedOrderStatus(order.status)) {
      continue
    }

    let currentOrder = order

    if (!currentOrder.statusStartedAt) {
      const statusStartedAt =
        currentOrder.status === "cooking" && currentOrder.cookingStartedAt
          ? currentOrder.cookingStartedAt
          : now
      const [updatedOrder] = await db
        .update(orders)
        .set({ statusStartedAt })
        .where(eq(orders.id, currentOrder.id))
        .returning()

      if (updatedOrder) {
        publishOrderUpdated(currentOrder, updatedOrder)
        currentOrder = updatedOrder
      }

      started += 1
    }

    const timeoutMs = getOrderTimeoutMs(currentOrder)

    if (!timeoutMs || !currentOrder.statusStartedAt) {
      continue
    }

    const panicAt = currentOrder.statusStartedAt + timeoutMs

    if (now >= panicAt) {
      const [updatedOrder] = await db
        .update(orders)
        .set({
          panic: true,
          panicFromStatus: currentOrder.panicFromStatus ?? currentOrder.status,
        })
        .where(eq(orders.id, currentOrder.id))
        .returning()

      if (updatedOrder) {
        publishOrderUpdated(currentOrder, updatedOrder)
      }

      panicked += 1
    }
  }

  return {
    checked: pendingOrders.length,
    started,
    panicked,
  }
}

export function makeTrackingId() {
  return `trk_${randomUUID().replaceAll("-", "").slice(0, 12)}`
}

function toNewOrder(input: OrderInput): NewOrder {
  const status = input.status ?? "received"

  return {
    id: randomUUID(),
    trackingId: input.trackingId?.trim() || makeTrackingId(),
    status,
    panic: input.panic ?? false,
    panicFromStatus: input.panic ? status : null,
    order: input.order,
    customerName: input.customerName?.trim() ?? "",
    customerAddress: input.customerAddress?.trim() ?? "",
    courierId: input.courierId?.trim() || null,
    cookingStartedAt: status === "cooking" ? Date.now() : null,
    statusStartedAt: Date.now(),
  }
}

function toOrderUpdate(
  currentOrder: Order | null,
  input: OrderUpdateInput
): OrderUpdateInput {
  const update: OrderUpdateInput = { ...input }

  if (input.status === "cooking") {
    update.cookingStartedAt =
      input.cookingStartedAt ?? currentOrder?.cookingStartedAt ?? Date.now()
  }

  if (input.status && input.status !== currentOrder?.status) {
    update.statusStartedAt = input.statusStartedAt ?? Date.now()
  }

  if (input.panic === true) {
    update.panicFromStatus =
      input.panicFromStatus ??
      currentOrder?.panicFromStatus ??
      input.status ??
      currentOrder?.status ??
      null
  }

  if (input.panic === false) {
    update.panicFromStatus = null
  }

  return update
}

function publishOrderCreated(order: Order) {
  publishOrderMutation({
    operation: "created",
    before: null,
    after: order,
    changedAt: Date.now(),
  })
}

function publishOrderUpdated(before: Order | null, after: Order) {
  publishOrderMutation({
    operation: "updated",
    before,
    after,
    changedAt: Date.now(),
  })
}

function publishOrderDeleted(order: Order) {
  publishOrderMutation({
    operation: "deleted",
    before: order,
    after: null,
    changedAt: Date.now(),
  })
}

function getAdjacentStatus(status: OrderStatus, direction: OrderMoveDirection) {
  const index = orderStatuses.indexOf(status)
  const nextIndex = direction === "prev" ? index - 1 : index + 1

  return orderStatuses[nextIndex]
}

async function getCapacityError(order: Order, nextStatus: OrderStatus) {
  if (nextStatus === "cooking") {
    const cookingOrders = await getDb()
      .select({ id: orders.id, status: orders.status, panic: orders.panic })
      .from(orders)
      .where(and(eq(orders.status, "cooking"), eq(orders.panic, false)))

    if (
      !cookingOrders.some((cookingOrder) => cookingOrder.id === order.id) &&
      cookingOrders.filter(orderUsesOven).length >= maxCookingOrders
    ) {
      return `All ${maxCookingOrders} ovens are busy.`
    }
  }

  if (nextStatus === "transit") {
    const transitOrders = await getTransitOrders()

    if (
      !transitOrders.some((transitOrder) => transitOrder.id === order.id) &&
      transitOrders.length >= maxTransitOrders
    ) {
      return `All ${maxTransitOrders} couriers are busy.`
    }

    const courierId = getAvailableCourierId(order, transitOrders)

    if (!courierId) {
      return "No courier is available."
    }
  }

  return null
}

async function getStatusUpdate(
  order: Order,
  nextStatus: OrderStatus
): Promise<OrderUpdateInput> {
  const update: OrderUpdateInput = {
    status: nextStatus,
    statusStartedAt: Date.now(),
  }

  if (nextStatus === "cooking" && order.status !== "cooking") {
    update.cookingStartedAt = Date.now()
  }

  if (nextStatus === "received") {
    update.cookingStartedAt = null
  }

  if (nextStatus === "transit") {
    update.courierId = getAvailableCourierId(order, await getTransitOrders())
  }

  if (order.status === "transit" && nextStatus === "cooked") {
    update.courierId = null
  }

  return update
}

async function getTransitOrders() {
  return getDb().select().from(orders).where(eq(orders.status, "transit"))
}

function getAvailableCourierId(order: Order, transitOrders: Order[]) {
  const occupiedCourierIds = new Set(
    transitOrders
      .filter((transitOrder) => transitOrder.id !== order.id)
      .map((transitOrder) => transitOrder.courierId)
      .filter((courierId): courierId is string => Boolean(courierId))
  )

  if (
    order.courierId &&
    couriers.some((courier) => courier.id === order.courierId) &&
    !occupiedCourierIds.has(order.courierId)
  ) {
    return order.courierId
  }

  return (
    couriers.find((courier) => !occupiedCourierIds.has(courier.id))?.id ?? null
  )
}
