"use server"

import { redirect } from "next/navigation"

import { createOrder } from "@/db/orders"
import { getPizzaById } from "@/lib/pizzas"

export type MenuOrderActionState = {
  ok: boolean
  message: string
}

export async function createMenuOrderAction(
  _previousState: MenuOrderActionState,
  formData: FormData
): Promise<MenuOrderActionState> {
  let trackingId: string

  try {
    const customerName = readRequiredString(formData, "customerName")
    const customerAddress = readRequiredString(formData, "customerAddress")
    const order = readPizzaIds(formData)

    const createdOrder = await createOrder({
      status: "received",
      order,
      customerName,
      customerAddress,
    })

    trackingId = createdOrder.trackingId
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Unable to place the order.",
    }
  }

  redirect(`/tracking/${trackingId}`)
}

function readRequiredString(formData: FormData, name: string) {
  const value = formData.get(name)

  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${name} is required.`)
  }

  return value.trim()
}

function readPizzaIds(formData: FormData) {
  const pizzaIds = formData
    .getAll("pizzaId")
    .map((value) => {
      if (typeof value !== "string") {
        throw new Error("Pizza ids must be text.")
      }

      return value.trim()
    })
    .filter(Boolean)

  if (pizzaIds.length === 0) {
    throw new Error("Add at least one pizza.")
  }

  for (const pizzaId of pizzaIds) {
    if (!getPizzaById(pizzaId)) {
      throw new Error("The order contains an unavailable pizza.")
    }
  }

  return pizzaIds
}
