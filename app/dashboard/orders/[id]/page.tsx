import { Suspense } from "react"
import OrderDetailsPageWrapper from "@/components/order-details-page-wrapper"
import { Loader2 } from "lucide-react"

interface OrderDetailsPageProps {
  params: {
    id: string
  }
}

export default function OrderDetailsPage({ params }: OrderDetailsPageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading order details...</p>
          </div>
        </div>
      }
    >
      <OrderDetailsPageWrapper orderId={params.id} />
    </Suspense>
  )
}

export async function generateMetadata({ params }: OrderDetailsPageProps) {
  return {
    title: `Order Details - ${params.id}`,
    description: "View detailed information about your order",
  }
}
