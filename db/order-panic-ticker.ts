import { tickOrderPanicState } from "@/db/orders"

export type OrderPanicTick = Awaited<ReturnType<typeof tickOrderPanicState>>

export type OrderPanicTicker = {
  stop: () => void
}

type OrderPanicTickerState = {
  activeStreams: number
  ticker: OrderPanicTicker | null
}

const globalForOrderPanicTicker = globalThis as typeof globalThis & {
  __pizzaPanicOrderPanicTicker?: OrderPanicTickerState
}

function getOrderPanicTickerState() {
  globalForOrderPanicTicker.__pizzaPanicOrderPanicTicker ??= {
    activeStreams: 0,
    ticker: null,
  }

  return globalForOrderPanicTicker.__pizzaPanicOrderPanicTicker
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

export function retainOrderPanicTicker() {
  const state = getOrderPanicTickerState()
  let released = false

  state.activeStreams += 1
  state.ticker ??= startOrderPanicTicker()

  return () => {
    if (released) {
      return
    }

    released = true
    state.activeStreams = Math.max(0, state.activeStreams - 1)

    if (state.activeStreams === 0) {
      state.ticker?.stop()
      state.ticker = null
    }
  }
}
