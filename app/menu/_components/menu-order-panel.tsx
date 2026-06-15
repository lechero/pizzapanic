"use client"

import * as React from "react"
import { Clock, Flame, Minus, Plus, ShoppingCart, X } from "lucide-react"

import { createMenuOrderAction, type MenuOrderActionState } from "@/app/menu/actions"
import { Button } from "@/components/ui/button"
import type { Pizza } from "@/lib/pizzas"
import { formatPizzaPrice } from "@/lib/pizzas"
import { cn } from "@/lib/utils"

type MenuOrderPanelProps = {
  pizzas: Pizza[]
}

type Basket = Record<string, number>

const initialState: MenuOrderActionState = {
  ok: false,
  message: "",
}

export function MenuOrderPanel({ pizzas }: MenuOrderPanelProps) {
  const [basket, setBasket] = React.useState<Basket>({})
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [state, formAction, pending] = React.useActionState(createMenuOrderAction, initialState)
  const titleId = React.useId()

  const basketLines = React.useMemo(
    () =>
      pizzas
        .map((pizza) => ({
          pizza,
          quantity: basket[pizza.id] ?? 0,
        }))
        .filter((line) => line.quantity > 0),
    [basket, pizzas]
  )
  const pizzaIds = React.useMemo(
    () => basketLines.flatMap((line) => Array.from({ length: line.quantity }, () => line.pizza.id)),
    [basketLines]
  )
  const itemCount = pizzaIds.length
  const total = basketLines.reduce((sum, line) => sum + line.pizza.price * line.quantity, 0)
  const selection = basketLines.map((line) => `${line.quantity}x ${line.pizza.name}`).join(", ")

  React.useEffect(() => {
    if (!dialogOpen) {
      return
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDialogOpen(false)
      }
    }

    window.addEventListener("keydown", onKeyDown)

    return () => {
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [dialogOpen])

  function addPizza(id: string) {
    setBasket((current) => ({
      ...current,
      [id]: (current[id] ?? 0) + 1,
    }))
  }

  function changePizzaQuantity(id: string, change: number) {
    setBasket((current) => {
      const next = { ...current }
      const quantity = (next[id] ?? 0) + change

      if (quantity <= 0) {
        delete next[id]
      } else {
        next[id] = quantity
      }

      return next
    })
  }

  function clearBasket() {
    setBasket({})
    setDialogOpen(false)
  }

  return (
    <>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {pizzas.map((pizza) => {
          const quantity = basket[pizza.id] ?? 0

          return (
            <article key={pizza.id} className="flex min-h-64 flex-col border border-border bg-card text-card-foreground">
              <div className="flex items-start justify-between gap-3 border-b border-border p-4">
                <div className="min-w-0">
                  <div className="font-mono text-xs text-muted-foreground">{pizza.publicId}</div>
                  <h2 className="mt-2 text-lg font-semibold leading-tight">{pizza.name}</h2>
                </div>
                <div className="grid size-14 shrink-0 place-items-center rounded-full border border-primary/30 bg-primary/10 text-primary">
                  <Flame className="size-5" />
                </div>
              </div>

              <div className="flex flex-1 flex-col justify-between gap-4 p-4">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-xl font-semibold">{formatPizzaPrice(pizza.price)}</span>
                  <span className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground">
                    <Clock className="size-3.5" />
                    {pizza.panicTime} min
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {quantity > 0 ? (
                    <div className="flex h-9 items-center border border-border">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="size-9"
                        onClick={() => changePizzaQuantity(pizza.id, -1)}
                      >
                        <Minus />
                        <span className="sr-only">Remove one {pizza.name}</span>
                      </Button>
                      <span className="min-w-8 text-center font-mono text-sm">{quantity}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="size-9"
                        onClick={() => changePizzaQuantity(pizza.id, 1)}
                      >
                        <Plus />
                        <span className="sr-only">Add one {pizza.name}</span>
                      </Button>
                    </div>
                  ) : null}

                  <Button type="button" className="min-w-0 flex-1" onClick={() => addPizza(pizza.id)}>
                    <Plus />
                    Add
                  </Button>
                </div>
              </div>
            </article>
          )
        })}
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 py-3 shadow-2xl backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <ShoppingCart className="size-5 shrink-0 text-primary" />
            <div className="min-w-0 flex-1 truncate text-sm">
              {itemCount > 0 ? (
                <>
                  <span className="font-semibold">{itemCount} selected</span>
                  <span className="text-muted-foreground"> - {selection}</span>
                </>
              ) : (
                <span className="text-muted-foreground">No pizzas selected</span>
              )}
            </div>
            <div className="shrink-0 font-mono text-sm font-semibold">{formatPizzaPrice(total)}</div>
          </div>
          <Button type="button" disabled={itemCount === 0} onClick={() => setDialogOpen(true)}>
            Order
          </Button>
        </div>
      </div>

      {dialogOpen ? (
        <div className="fixed inset-0 z-50 grid bg-background/80 backdrop-blur-sm sm:place-items-center">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 cursor-default"
            onClick={() => setDialogOpen(false)}
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative flex h-full w-full flex-col border-border bg-background shadow-2xl sm:h-auto sm:max-h-[90vh] sm:max-w-lg sm:border"
          >
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div className="min-w-0">
                <h2 id={titleId} className="truncate text-base font-semibold">
                  Order
                </h2>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {itemCount} pizzas - {formatPizzaPrice(total)}
                </p>
              </div>
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => setDialogOpen(false)}>
                <X />
                <span className="sr-only">Close</span>
              </Button>
            </div>

            <form action={formAction} className="min-h-0 overflow-y-auto px-5 py-5">
              {pizzaIds.map((pizzaId, index) => (
                <input key={`${pizzaId}-${index}`} type="hidden" name="pizzaId" value={pizzaId} />
              ))}

              <div className="grid gap-4">
                <Field label="Name" htmlFor={`${titleId}-name`}>
                  <input
                    id={`${titleId}-name`}
                    name="customerName"
                    required
                    autoComplete="name"
                    className="h-10 w-full border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                  />
                </Field>

                <Field label="Address" htmlFor={`${titleId}-address`}>
                  <input
                    id={`${titleId}-address`}
                    name="customerAddress"
                    required
                    autoComplete="street-address"
                    className="h-10 w-full border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                  />
                </Field>

                <div className="border border-border">
                  {basketLines.map((line) => (
                    <div
                      key={line.pizza.id}
                      className="flex items-center justify-between gap-3 border-b border-border px-3 py-2 text-sm last:border-b-0"
                    >
                      <span className="min-w-0 truncate">{line.pizza.name}</span>
                      <span className="shrink-0 font-mono text-xs text-muted-foreground">
                        {line.quantity} x {formatPizzaPrice(line.pizza.price)}
                      </span>
                    </div>
                  ))}
                </div>
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
                <Button type="button" variant="outline" onClick={clearBasket}>
                  Clear
                </Button>
                <Button type="submit" disabled={pending || itemCount === 0}>
                  {pending ? "Ordering" : "Submit"}
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
      <label htmlFor={htmlFor} className="text-xs font-semibold uppercase text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  )
}
