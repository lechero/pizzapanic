export const orderStatuses = [
  "received",
  "cooking",
  "cooked",
  "transit",
  "delivered",
] as const

export type OrderStatus = (typeof orderStatuses)[number]
