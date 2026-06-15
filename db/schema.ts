import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { orderStatuses } from "@/lib/order-statuses"

export { orderStatuses, type OrderStatus } from "@/lib/order-statuses"

export const orders = sqliteTable(
  "order",
  {
    id: text("id").primaryKey(),
    trackingId: text("tracking_id").notNull().unique(),
    status: text("status", { enum: orderStatuses })
      .notNull()
      .default("received"),
    panic: integer("panic", { mode: "boolean" }).notNull().default(false),
    panicFromStatus: text("panic_from_status", { enum: orderStatuses }),
    order: text("order", { mode: "json" }).$type<string[]>().notNull(),
    customerName: text("customer_name").notNull().default(""),
    customerAddress: text("customer_address").notNull().default(""),
    courierId: text("courier_id"),
    cookingStartedAt: integer("cooking_started_at"),
    statusStartedAt: integer("status_started_at"),
  },
  (table) => [
    index("order_status_idx").on(table.status),
    index("order_tracking_id_idx").on(table.trackingId),
    index("order_courier_id_idx").on(table.courierId),
  ]
)

export type Order = typeof orders.$inferSelect
export type NewOrder = typeof orders.$inferInsert
