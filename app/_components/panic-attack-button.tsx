"use client"

import * as React from "react"
import { Siren } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type PanicAttackResponse = {
  count?: number
  error?: string
}

export function PanicAttackButton() {
  const [isPending, startTransition] = React.useTransition()
  const [message, setMessage] = React.useState("")
  const [ok, setOk] = React.useState<boolean | null>(null)

  function handleClick() {
    startTransition(async () => {
      setMessage("")
      setOk(null)

      try {
        const response = await fetch("/api/panic", {
          method: "POST",
          headers: {
            Accept: "application/json",
          },
        })
        const data = (await response.json()) as PanicAttackResponse

        if (!response.ok) {
          throw new Error(data.error ?? "Unable to start panic attack.")
        }

        setOk(true)
        setMessage(`${data.count ?? 0} orders launched.`)
      } catch (error) {
        setOk(false)
        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to start panic attack."
        )
      }
    })
  }

  return (
    <div className="grid gap-2">
      <Button
        type="button"
        variant="destructive"
        size="lg"
        disabled={isPending}
        onClick={handleClick}
        className="w-full justify-between"
      >
        {isPending ? "Launching" : "Panic Attack"}
        <Siren />
      </Button>
      {message ? (
        <p
          className={cn(
            "border px-3 py-2 text-sm",
            ok
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "border-destructive/30 bg-destructive/10 text-destructive"
          )}
        >
          {message}
        </p>
      ) : null}
    </div>
  )
}
