"use client"

import * as React from "react"
import { Plus, Save, X } from "lucide-react"
import { useRouter } from "next/navigation"

import { createOrderAction, updateOrderAction, type OrderActionState } from "@/app/orders/actions"
import { Button } from "@/components/ui/button"
import type { Order } from "@/db/schema"
import { orderStatuses } from "@/lib/order-statuses"
import { cn } from "@/lib/utils"

type OrderEditSheetProps = {
  order?: Order
  mode: "create" | "edit"
  triggerLabel?: string
  triggerClassName?: string
}

const initialState: OrderActionState = {
  ok: false,
  message: "",
}

export function OrderEditSheet({
  order,
  mode,
  triggerLabel = mode === "create" ? "New order" : "Edit",
  triggerClassName,
}: OrderEditSheetProps) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const action = mode === "create" ? createOrderAction : updateOrderAction
  const [state, formAction, pending] = React.useActionState(action, initialState)
  const titleId = React.useId()

  React.useEffect(() => {
    if (!state.ok) {
      return
    }

    if (mode === "create" && state.orderId) {
      router.push(`/orders/${state.orderId}`)
      return
    }

    router.refresh()
  }, [mode, router, state])

  React.useEffect(() => {
    if (!open) {
      return
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false)
      }
    }

    window.addEventListener("keydown", onKeyDown)

    return () => {
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  return (
    <>
      <Button
        type="button"
        variant={mode === "create" ? "default" : "outline"}
        size={mode === "create" ? "sm" : "xs"}
        className={triggerClassName}
        onClick={() => setOpen(true)}
      >
        {mode === "create" ? <Plus /> : <Save />}
        {triggerLabel}
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 grid bg-background/80 backdrop-blur-sm sm:place-items-center">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 cursor-default"
            onClick={() => setOpen(false)}
          />
          <section
            aria-labelledby={titleId}
            className="relative flex h-full w-full flex-col border-border bg-background shadow-2xl sm:h-auto sm:max-h-[90vh] sm:max-w-xl sm:border"
          >
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div className="min-w-0">
                <h2 id={titleId} className="truncate text-base font-semibold">
                  {mode === "create" ? "New order" : order?.trackingId}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {mode === "create" ? "Create a kitchen order." : "Update status, pizza ids, and courier."}
                </p>
              </div>
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => setOpen(false)}>
                <X />
                <span className="sr-only">Close</span>
              </Button>
            </div>

            <form action={formAction} className="min-h-0 overflow-y-auto px-5 py-5">
              {order ? <input type="hidden" name="id" value={order.id} /> : null}

              <div className="grid gap-4">
                <Field label="Tracking ID" htmlFor={`${titleId}-tracking`}>
                  <input
                    id={`${titleId}-tracking`}
                    name="trackingId"
                    defaultValue={order?.trackingId ?? ""}
                    disabled={mode === "edit"}
                    placeholder="Auto-generated when empty"
                    className="h-10 w-full border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:bg-muted disabled:text-muted-foreground"
                  />
                </Field>

                <Field label="Status" htmlFor={`${titleId}-status`}>
                  <select
                    id={`${titleId}-status`}
                    name="status"
                    defaultValue={order?.status ?? "received"}
                    className="h-10 w-full border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                  >
                    {orderStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Pizza IDs" htmlFor={`${titleId}-order`}>
                  <textarea
                    id={`${titleId}-order`}
                    name="order"
                    required
                    defaultValue={order?.order.join("\n") ?? ""}
                    placeholder="pizza-margherita&#10;pizza-funghi"
                    className="min-h-28 w-full resize-y border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                  />
                </Field>

                <Field label="Courier ID" htmlFor={`${titleId}-courier`}>
                  <input
                    id={`${titleId}-courier`}
                    name="courierId"
                    defaultValue={order?.courierId ?? ""}
                    placeholder="Unassigned"
                    className="h-10 w-full border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                  />
                </Field>

                <label className="flex items-center gap-3 border border-border px-3 py-3 text-sm">
                  <input
                    name="panic"
                    type="checkbox"
                    defaultChecked={order?.panic ?? false}
                    className="size-4 accent-primary"
                  />
                  Panic
                </label>
              </div>

              {state.message ? (
                <p
                  className={cn(
                    "mt-4 border px-3 py-2 text-sm",
                    state.ok
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : "border-destructive/30 bg-destructive/10 text-destructive"
                  )}
                >
                  {state.message}
                </p>
              ) : null}

              <div className="mt-5 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={pending}>
                  <Save />
                  {pending ? "Saving" : "Save"}
                </Button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </>
  )
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-2">
      <label htmlFor={htmlFor} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  )
}
