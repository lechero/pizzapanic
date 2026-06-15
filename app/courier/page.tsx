"use client"

import Link from "next/link"
import { Bike, ChevronRight, UsersRound } from "lucide-react"

import { Button } from "@/components/ui/button"
import { couriers } from "@/lib/kitchen"

export default function CourierPage() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs text-muted-foreground uppercase">
            Courier
          </p>
          <h1 className="mt-2 text-2xl font-semibold">Choose a courier</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Select a courier to pick up cooked orders and complete active
            deliveries.
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 border border-border px-3 py-2 font-mono text-xs text-muted-foreground">
          <UsersRound className="size-4" />
          {couriers.length} couriers
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {couriers.map((courier) => (
          <article
            key={courier.id}
            className="flex min-h-44 flex-col justify-between border border-border bg-card text-card-foreground"
          >
            <div className="flex items-start justify-between gap-3 border-b border-border p-4">
              <div className="min-w-0">
                <div className="font-mono text-xs text-muted-foreground">
                  {courier.publicId}
                </div>
                <h2 className="mt-2 truncate text-lg font-semibold">
                  {courier.name}
                </h2>
              </div>
              <div className="grid size-11 shrink-0 place-items-center border border-primary/30 bg-primary/10 text-primary">
                <Bike className="size-5" />
              </div>
            </div>
            <div className="p-4">
              <Button asChild className="w-full justify-between">
                <Link href={`/courier/${courier.publicId}`}>
                  Select
                  <ChevronRight />
                </Link>
              </Button>
            </div>
          </article>
        ))}
      </section>
    </main>
  )
}
