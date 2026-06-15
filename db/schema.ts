import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const orderStatuses = [
  "received",
  "cooking",
  "cooked",
  "transit",
  "delivered",
] as const

export type OrderStatus = (typeof orderStatuses)[number]

export const orders = sqliteTable(
  "order",
  {
    id: text("id").primaryKey(),
    trackingId: text("tracking_id").notNull().unique(),
    status: text("status", { enum: orderStatuses }).notNull().default("received"),
    panic: integer("panic", { mode: "boolean" }).notNull().default(false),
    order: text("order", { mode: "json" }).$type<string[]>().notNull(),
    courierId: text("courier_id"),
  },
  (table) => [
    index("order_status_idx").on(table.status),
    index("order_tracking_id_idx").on(table.trackingId),
    index("order_courier_id_idx").on(table.courierId),
  ]
)

export type Order = typeof orders.$inferSelect
export type NewOrder = typeof orders.$inferInsert
