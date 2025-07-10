import { OrderDetailsPageWrapper } from "@/components/order-details-page-wrapper"

interface OrderDetailsPageProps {
  params: Promise<{ id: string }>
}

export default async function OrderDetailsPage({ params }: OrderDetailsPageProps) {
  const { id } = await params

  return <OrderDetailsPageWrapper orderId={id} />
}
