import { cn } from "@/lib/utils"
import type { OrderStatus } from "@/lib/order-statuses"

const statusClasses = {
  received: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  cooking: "border-primary/30 bg-primary/10 text-primary",
  cooked: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  transit: "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  delivered: "border-muted-foreground/30 bg-muted text-muted-foreground",
} satisfies Record<OrderStatus, string>

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center border px-2 font-mono text-[11px] font-medium uppercase",
        statusClasses[status]
      )}
    >
      {status}
    </span>
  )
}

export function PanicBadge({ panic }: { panic: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center border px-2 font-mono text-[11px] font-medium uppercase",
        panic
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : "border-border bg-muted text-muted-foreground"
      )}
    >
      {panic ? "panic" : "calm"}
    </span>
  )
}
