import { randomUUID } from "node:crypto"

import { eq } from "drizzle-orm"
import type { NextRequest } from "next/server"

import { getDb } from "@/db"
import { orders, orderStatuses, type OrderStatus } from "@/db/schema"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

class ApiError extends Error {
  constructor(
    message: string,
    readonly status = 400
  ) {
    super(message)
  }
}

type OrderBody = {
  id?: unknown
  trackingId?: unknown
  status?: unknown
  panic?: unknown
  order?: unknown
  customerName?: unknown
  customerAddress?: unknown
  courierId?: unknown
}

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, init)
}

function errorResponse(error: unknown) {
  if (error instanceof ApiError) {
    return json({ error: error.message }, { status: error.status })
  }

  if (isSqliteUniqueConstraint(error)) {
    return json(
      { error: "An order with this trackingId already exists." },
      { status: 409 }
    )
  }

  console.error(error)
  return json(
    { error: "Unable to process the order request." },
    { status: 500 }
  )
}

function isSqliteUniqueConstraint(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "SQLITE_CONSTRAINT_UNIQUE"
  )
}

async function readBody(request: Request): Promise<OrderBody> {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    throw new ApiError("Request body must be valid JSON.")
  }

  if (!isRecord(body)) {
    throw new ApiError("Request body must be a JSON object.")
  }

  return body
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function readLookupFromSearchParams(searchParams: URLSearchParams) {
  const id = normalizeOptionalString(searchParams.get("id"), "id")
  const trackingId = normalizeOptionalString(
    searchParams.get("trackingId"),
    "trackingId"
  )

  if (id && trackingId) {
    throw new ApiError("Use either id or trackingId, not both.")
  }

  return { id, trackingId }
}

function readLookupFromBody(body: OrderBody) {
  const id = normalizeOptionalString(body.id, "id")
  const trackingId = normalizeOptionalString(body.trackingId, "trackingId")

  if (id && trackingId) {
    throw new ApiError("Use either id or trackingId, not both.")
  }

  if (!id && !trackingId) {
    throw new ApiError("Provide id or trackingId.")
  }

  return { id, trackingId }
}

function normalizeOptionalString(value: unknown, field: string) {
  if (value === undefined || value === null) {
    return undefined
  }

  if (typeof value !== "string") {
    throw new ApiError(`${field} must be a string.`)
  }

  const trimmed = value.trim()

  if (!trimmed) {
    throw new ApiError(`${field} cannot be empty.`)
  }

  return trimmed
}

function normalizeStatus(value: unknown, fallback?: OrderStatus) {
  if (value === undefined) {
    return fallback
  }

  if (
    typeof value !== "string" ||
    !orderStatuses.includes(value as OrderStatus)
  ) {
    throw new ApiError(`status must be one of: ${orderStatuses.join(", ")}.`)
  }

  return value as OrderStatus
}

function normalizePanic(value: unknown, fallback?: boolean) {
  if (value === undefined) {
    return fallback
  }

  if (typeof value !== "boolean") {
    throw new ApiError("panic must be a boolean.")
  }

  return value
}

function normalizePizzaIds(value: unknown, required: true): string[]
function normalizePizzaIds(
  value: unknown,
  required: false
): string[] | undefined
function normalizePizzaIds(value: unknown, required: boolean) {
  if (value === undefined && !required) {
    return undefined
  }

  if (!Array.isArray(value)) {
    throw new ApiError("order must be an array of pizza ids.")
  }

  const pizzaIds = value.map((pizzaId, index) => {
    if (typeof pizzaId !== "string") {
      throw new ApiError(`order[${index}] must be a string.`)
    }

    const trimmed = pizzaId.trim()

    if (!trimmed) {
      throw new ApiError(`order[${index}] cannot be empty.`)
    }

    return trimmed
  })

  if (required && pizzaIds.length === 0) {
    throw new ApiError("order must contain at least one pizza id.")
  }

  return pizzaIds
}

function normalizeCourierId(value: unknown) {
  if (value === undefined) {
    return undefined
  }

  if (value === null) {
    return null
  }

  return normalizeOptionalString(value, "courierId")
}

function normalizeCustomerText(value: unknown, field: string) {
  if (value === undefined) {
    return undefined
  }

  if (typeof value !== "string") {
    throw new ApiError(`${field} must be a string.`)
  }

  return value.trim()
}

function makeTrackingId() {
  return `trk_${randomUUID().replaceAll("-", "").slice(0, 12)}`
}

function whereOrder(input: { id?: string; trackingId?: string }) {
  if (input.id) {
    return eq(orders.id, input.id)
  }

  if (input.trackingId) {
    return eq(orders.trackingId, input.trackingId)
  }

  throw new ApiError("Provide id or trackingId.")
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const lookup = readLookupFromSearchParams(searchParams)
    const db = getDb()

    if (lookup.id || lookup.trackingId) {
      const [order] = await db
        .select()
        .from(orders)
        .where(whereOrder(lookup))
        .limit(1)

      if (!order) {
        return json({ error: "Order not found." }, { status: 404 })
      }

      return json({ order })
    }

    const orderRows = await db.select().from(orders).orderBy(orders.trackingId)
    return json({ orders: orderRows })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(request: Request) {
  try {
    const body = await readBody(request)
    const order = normalizePizzaIds(body.order, true)
    const status = normalizeStatus(body.status, "received")
    const panic = normalizePanic(body.panic, false)
    const trackingId =
      normalizeOptionalString(body.trackingId, "trackingId") ?? makeTrackingId()
    const customerName =
      normalizeCustomerText(body.customerName, "customerName") ?? ""
    const customerAddress =
      normalizeCustomerText(body.customerAddress, "customerAddress") ?? ""
    const courierId = normalizeCourierId(body.courierId) ?? null

    const [createdOrder] = await getDb()
      .insert(orders)
      .values({
        id: randomUUID(),
        trackingId,
        status,
        panic,
        order,
        customerName,
        customerAddress,
        courierId,
        cookingStartedAt: status === "cooking" ? Date.now() : null,
      })
      .returning()

    return json({ order: createdOrder }, { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await readBody(request)
    const lookup = readLookupFromBody(body)
    const updates: Partial<typeof orders.$inferInsert> = {}

    if ("status" in body) {
      updates.status = normalizeStatus(body.status)

      if (updates.status === "cooking") {
        const [currentOrder] = await getDb()
          .select({ cookingStartedAt: orders.cookingStartedAt })
          .from(orders)
          .where(whereOrder(lookup))
          .limit(1)

        updates.cookingStartedAt = currentOrder?.cookingStartedAt ?? Date.now()
      }

      if (updates.status === "received") {
        updates.cookingStartedAt = null
      }
    }

    if ("panic" in body) {
      updates.panic = normalizePanic(body.panic)
    }

    if ("order" in body) {
      updates.order = normalizePizzaIds(body.order, true)
    }

    if ("customerName" in body) {
      updates.customerName = normalizeCustomerText(
        body.customerName,
        "customerName"
      )
    }

    if ("customerAddress" in body) {
      updates.customerAddress = normalizeCustomerText(
        body.customerAddress,
        "customerAddress"
      )
    }

    if ("courierId" in body) {
      updates.courierId = normalizeCourierId(body.courierId) ?? null
    }

    if (Object.keys(updates).length === 0) {
      throw new ApiError("Provide at least one field to update.")
    }

    const [updatedOrder] = await getDb()
      .update(orders)
      .set(updates)
      .where(whereOrder(lookup))
      .returning()

    if (!updatedOrder) {
      return json({ error: "Order not found." }, { status: 404 })
    }

    return json({ order: updatedOrder })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const lookup = readLookupFromSearchParams(request.nextUrl.searchParams)

    if (!lookup.id && !lookup.trackingId) {
      throw new ApiError("Provide id or trackingId.")
    }

    const [deletedOrder] = await getDb()
      .delete(orders)
      .where(whereOrder(lookup))
      .returning()

    if (!deletedOrder) {
      return json({ error: "Order not found." }, { status: 404 })
    }

    return json({ order: deletedOrder })
  } catch (error) {
    return errorResponse(error)
  }
}
