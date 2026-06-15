"use client"

import * as React from "react"
import { Clock3 } from "lucide-react"

import { formatTimerDuration } from "@/lib/order-timeouts"
import { cn } from "@/lib/utils"

type OrderTimerBadgeProps = {
  panic: boolean
  startedAt: number | null
  timeoutMs: number | null
}

export function OrderTimerBadge({
  panic,
  startedAt,
  timeoutMs,
}: OrderTimerBadgeProps) {
  const [now, setNow] = React.useState(() => Date.now())
  const hasTimer = Boolean(startedAt && timeoutMs)

  React.useEffect(() => {
    if (!hasTimer || panic) {
      return
    }

    const interval = window.setInterval(() => {
      React.startTransition(() => {
        setNow(Date.now())
      })
    }, 1_000)

    return () => {
      window.clearInterval(interval)
    }
  }, [hasTimer, panic])

  if (panic) {
    return <TimerBadgeContent tone="panic" label="panic" />
  }

  if (!startedAt || !timeoutMs) {
    return <TimerBadgeContent tone="idle" label="no timer" />
  }

  const remainingMs = timeoutMs - Math.max(0, now - startedAt)
  const elapsedRatio = Math.min(1, Math.max(0, (now - startedAt) / timeoutMs))
  const isExpired = remainingMs <= 0
  const tone = isExpired ? "expired" : elapsedRatio >= 0.75 ? "warning" : "ok"
  const label = isExpired
    ? `+${formatTimerDuration(remainingMs)}`
    : formatTimerDuration(remainingMs)

  return <TimerBadgeContent tone={tone} label={label} />
}

function TimerBadgeContent({
  tone,
  label,
}: {
  tone: "ok" | "warning" | "expired" | "panic" | "idle"
  label: string
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 border px-2 font-mono text-[11px] font-medium uppercase tabular-nums",
        tone === "ok"
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          : tone === "warning"
            ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
            : tone === "idle"
              ? "border-border bg-muted text-muted-foreground"
              : "border-destructive/30 bg-destructive/10 text-destructive"
      )}
    >
      <Clock3 className="size-3" />
      {label}
    </span>
  )
}
