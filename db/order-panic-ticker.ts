import { tickOrderPanicState } from "@/db/orders"

export type OrderPanicTick = Awaited<ReturnType<typeof tickOrderPanicState>>

export type OrderPanicTicker = {
  stop: () => void
}

export function startOrderPanicTicker(
  input: {
    intervalMs?: number
    onTick?: (tick: OrderPanicTick) => void | Promise<void>
  } = {}
): OrderPanicTicker {
  const intervalMs = input.intervalMs ?? 5_000
  let running = false

  async function run() {
    if (running) {
      return
    }

    running = true

    try {
      const tick = await tickOrderPanicState()
      await input.onTick?.(tick)
    } finally {
      running = false
    }
  }

  const interval = setInterval(() => {
    void run()
  }, intervalMs)

  void run()

  return {
    stop() {
      clearInterval(interval)
    },
  }
}
