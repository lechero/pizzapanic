import { notFound } from "next/navigation"

import { OrderDetail } from "@/app/orders/_components/order-detail"
import { getOrderById } from "@/db/orders"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type OrderDetailPageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params
  const order = await getOrderById(id)

  if (!order) {
    notFound()
  }

  return <OrderDetail order={order} />
}
