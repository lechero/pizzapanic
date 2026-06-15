"use server"

import { revalidatePath } from "next/cache"

import {
  moveOrderStatus,
  panicOrder,
  type OrderMoveDirection,
} from "@/db/orders"

export type TonyOrderActionState = {
  ok: boolean
  message: string
}

export async function updateTonyOrderAction(
  _previousState: TonyOrderActionState,
  formData: FormData
): Promise<TonyOrderActionState> {
  const id = readRequiredString(formData, "id")
  const intent = readRequiredString(formData, "intent")

  const result =
    intent === "panic"
      ? await panicOrder(id)
      : intent === "prev" || intent === "next"
        ? await moveOrderStatus(id, intent as OrderMoveDirection)
        : {
            ok: false,
            message: "Unknown Tony action.",
          }

  revalidateOrderPaths(id, result.order?.trackingId)

  return {
    ok: result.ok,
    message: result.message,
  }
}

function readRequiredString(formData: FormData, name: string) {
  const value = formData.get(name)

  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${name} is required.`)
  }

  return value.trim()
}

function revalidateOrderPaths(id: string, trackingId?: string) {
  revalidatePath("/tony")
  revalidatePath("/orders")
  revalidatePath(`/orders/${id}`)

  if (trackingId) {
    revalidatePath(`/tracking/${trackingId}`)
  }
}
