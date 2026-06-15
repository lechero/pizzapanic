"use server"

import { revalidatePath } from "next/cache"

import {
  deliverCourierOrder,
  pickUpCookedOrder,
  type OrderMutationResult,
} from "@/db/orders"
import { getCourierByPublicId } from "@/lib/kitchen"

export type CourierOrderActionState = {
  ok: boolean
  message: string
}

export async function updateCourierOrderAction(
  _previousState: CourierOrderActionState,
  formData: FormData
): Promise<CourierOrderActionState> {
  try {
    const publicId = readRequiredString(formData, "publicId")
    const orderId = readRequiredString(formData, "orderId")
    const intent = readRequiredString(formData, "intent")
    const courier = getCourierByPublicId(publicId)

    if (!courier) {
      return {
        ok: false,
        message: "Courier not found.",
      }
    }

    const result =
      intent === "pickup"
        ? await pickUpCookedOrder({ orderId, courierId: courier.id })
        : intent === "deliver"
          ? await deliverCourierOrder({ orderId, courierId: courier.id })
          : {
              ok: false,
              message: "Unknown courier action.",
            }

    revalidateCourierPaths(courier.publicId, result)

    return {
      ok: result.ok,
      message: result.message,
    }
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Unable to update the order.",
    }
  }
}

function readRequiredString(formData: FormData, name: string) {
  const value = formData.get(name)

  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${name} is required.`)
  }

  return value.trim()
}

function revalidateCourierPaths(publicId: string, result: OrderMutationResult) {
  revalidatePath("/courier")
  revalidatePath(`/courier/${publicId}`)
  revalidatePath("/orders")
  revalidatePath("/tony")

  if (result.order?.trackingId) {
    revalidatePath(`/tracking/${result.order.trackingId}`)
  }
}
