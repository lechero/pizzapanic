"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { createOrder, deleteOrder, updateOrder } from "@/db/orders"
import { orderStatuses, type OrderStatus } from "@/lib/order-statuses"

export type OrderActionState = {
  ok: boolean
  message: string
  orderId?: string
}

export async function createOrderAction(
  _previousState: OrderActionState,
  formData: FormData
): Promise<OrderActionState> {
  try {
    const createdOrder = await createOrder({
      trackingId: readOptionalString(formData, "trackingId"),
      status: readStatus(formData),
      panic: readBoolean(formData, "panic"),
      order: readPizzaIds(formData),
      courierId: readNullableString(formData, "courierId"),
    })

    revalidatePath("/orders")

    return {
      ok: true,
      message: "Order created.",
      orderId: createdOrder.id,
    }
  } catch (error) {
    return actionError(error, "Unable to create order.")
  }
}

export async function updateOrderAction(
  _previousState: OrderActionState,
  formData: FormData
): Promise<OrderActionState> {
  try {
    const id = readRequiredString(formData, "id")
    const updatedOrder = await updateOrder(id, {
      status: readStatus(formData),
      panic: readBoolean(formData, "panic"),
      order: readPizzaIds(formData),
      courierId: readNullableString(formData, "courierId"),
    })

    if (!updatedOrder) {
      return {
        ok: false,
        message: "Order not found.",
      }
    }

    revalidatePath("/orders")
    revalidatePath(`/orders/${id}`)

    return {
      ok: true,
      message: "Order updated.",
      orderId: id,
    }
  } catch (error) {
    return actionError(error, "Unable to update order.")
  }
}

export async function deleteOrderAction(formData: FormData): Promise<void> {
  const id = readRequiredString(formData, "id")

  await deleteOrder(id)
  revalidatePath("/orders")
  revalidatePath(`/orders/${id}`)
  redirect("/orders")
}

function readRequiredString(formData: FormData, name: string) {
  const value = formData.get(name)

  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${name} is required.`)
  }

  return value.trim()
}

function readOptionalString(formData: FormData, name: string) {
  const value = formData.get(name)

  if (value === null) {
    return undefined
  }

  if (typeof value !== "string") {
    throw new Error(`${name} must be text.`)
  }

  return value.trim() || undefined
}

function readNullableString(formData: FormData, name: string) {
  return readOptionalString(formData, name) ?? null
}

function readStatus(formData: FormData): OrderStatus {
  const value = formData.get("status")

  if (typeof value !== "string" || !orderStatuses.includes(value as OrderStatus)) {
    throw new Error(`status must be one of: ${orderStatuses.join(", ")}.`)
  }

  return value as OrderStatus
}

function readBoolean(formData: FormData, name: string) {
  return formData.get(name) === "on"
}

function readPizzaIds(formData: FormData) {
  const value = formData.get("order")

  if (typeof value !== "string") {
    throw new Error("order is required.")
  }

  const pizzaIds = value
    .split(/[\n,]/)
    .map((pizzaId) => pizzaId.trim())
    .filter(Boolean)

  if (pizzaIds.length === 0) {
    throw new Error("Add at least one pizza id.")
  }

  return pizzaIds
}

function actionError(error: unknown, fallback: string): OrderActionState {
  if (isSqliteUniqueConstraint(error)) {
    return {
      ok: false,
      message: "An order with this tracking id already exists.",
    }
  }

  return {
    ok: false,
    message: error instanceof Error ? error.message : fallback,
  }
}

function isSqliteUniqueConstraint(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "SQLITE_CONSTRAINT_UNIQUE"
  )
}
